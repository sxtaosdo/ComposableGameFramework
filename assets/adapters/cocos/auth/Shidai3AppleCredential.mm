#import <AuthenticationServices/AuthenticationServices.h>
#import <Security/Security.h>
#import <UIKit/UIKit.h>
#include <cstring>

// DEVELOPMENT reflection candidate. Host configures explicitly; no SDK calls at load time.
@interface Shidai3AppleRequest : NSObject <ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding>
@property(nonatomic, copy) NSString *requestId;
@property(nonatomic, copy) NSString *nonce;
@property(nonatomic, copy) NSString *result;
@property(nonatomic, strong) UIWindow *window;
@property(nonatomic, strong) ASAuthorizationController *controller;
@property(nonatomic) BOOL valid;
@end
@interface Shidai3AppleCredential : NSObject
+ (void)configure:(UIWindow *)window enabled:(BOOL)enabled;
+ (BOOL)isConfigured;
+ (NSString *)nonce;
+ (BOOL)begin:(NSString *)requestId nonce:(NSString *)nonce;
+ (NSString *)poll:(NSString *)requestId;
+ (BOOL)cancel:(NSString *)requestId;
@end
static __weak UIWindow *S3AppleWindow;
static BOOL S3AppleEnabled = NO;
static Shidai3AppleRequest *S3AppleActive;
static BOOL S3AppleRandom(NSString *value) {
    if (value.length != 64) return NO;
    return [value rangeOfCharacterFromSet:[[NSCharacterSet characterSetWithCharactersInString:@"abcdef0123456789"] invertedSet]].location == NSNotFound;
}
static BOOL S3AppleOpaque(NSString *value, NSUInteger maximum) {
    if (!value.length || value.length > maximum) return NO;
    NSMutableCharacterSet *bad = [[NSCharacterSet whitespaceAndNewlineCharacterSet] mutableCopy];
    [bad formUnionWithCharacterSet:[NSCharacterSet controlCharacterSet]];
    return [value rangeOfCharacterFromSet:bad].location == NSNotFound;
}
static void S3AppleRelease(Shidai3AppleRequest *request) {
    request.valid = NO; request.result = nil; request.requestId = nil; request.nonce = nil;
    request.controller.delegate = nil; request.controller.presentationContextProvider = nil;
    request.controller = nil; request.window = nil;
    if (S3AppleActive == request) S3AppleActive = nil;
}
@implementation Shidai3AppleCredential
+ (void)configure:(UIWindow *)window enabled:(BOOL)enabled {
    @synchronized(self) {
        if (S3AppleActive.valid) [self cancel:S3AppleActive.requestId];
        S3AppleWindow = window; S3AppleEnabled = enabled;
    }
}
+ (BOOL)isConfigured { @synchronized(self) { return S3AppleEnabled && S3AppleWindow != nil; } }
+ (NSString *)nonce {
    unsigned char bytes[32];
    if (SecRandomCopyBytes(kSecRandomDefault, sizeof(bytes), bytes) != errSecSuccess) return @"";
    NSMutableString *hex = [NSMutableString stringWithCapacity:64];
    for (NSUInteger i = 0; i < sizeof(bytes); i++) [hex appendFormat:@"%02x", bytes[i]];
    memset(bytes, 0, sizeof(bytes)); return hex;
}
+ (BOOL)begin:(NSString *)requestId nonce:(NSString *)nonce {
    @synchronized(self) {
        if (![self isConfigured] || S3AppleActive || !S3AppleRandom(requestId) || !S3AppleRandom(nonce) || [requestId isEqualToString:nonce]) return NO;
        Shidai3AppleRequest *request = [Shidai3AppleRequest new];
        request.requestId = requestId; request.nonce = nonce; request.window = S3AppleWindow; request.valid = YES;
        S3AppleActive = request;
        dispatch_async(dispatch_get_main_queue(), ^{
            @synchronized(self) {
                if (S3AppleActive != request) return;
                if (!request.valid) { S3AppleRelease(request); return; }
                ASAuthorizationAppleIDRequest *query = [[ASAuthorizationAppleIDProvider new] createRequest];
                query.nonce = request.nonce; query.state = request.requestId; // Native raw nonce, not Firebase SHA256(rawNonce).
                request.controller = [[ASAuthorizationController alloc] initWithAuthorizationRequests:@[query]];
                request.controller.delegate = request; request.controller.presentationContextProvider = request;
                [request.controller performRequests];
            }
        });
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 60 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
            @synchronized(self) { if (S3AppleActive == request && request.valid) [self cancel:request.requestId]; }
        });
        return YES;
    }
}
+ (NSString *)poll:(NSString *)requestId {
    @synchronized(self) {
        if (!S3AppleActive.valid || ![S3AppleActive.requestId isEqualToString:requestId] || !S3AppleActive.result) return @"";
        NSString *result = S3AppleActive.result;
        S3AppleRelease(S3AppleActive); return result;
    }
}
+ (BOOL)cancel:(NSString *)requestId {
    @synchronized(self) {
        Shidai3AppleRequest *request = S3AppleActive;
        if (!request.valid || ![request.requestId isEqualToString:requestId]) return NO;
        request.valid = NO; request.result = nil; request.requestId = nil; request.nonce = nil;
        if (!request.controller) { S3AppleRelease(request); return YES; } // Queued begin/settled result must not leave a busy slot.
        ASAuthorizationController *controller = request.controller;
        dispatch_async(dispatch_get_main_queue(), ^{ if (@available(iOS 16.0, *)) [controller cancel]; });
        // Retain weak delegates until terminal callback, blocking overlap on iOS13-15.
        return YES;
    }
}
@end
@implementation Shidai3AppleRequest
- (ASPresentationAnchor)presentationAnchorForAuthorizationController:(ASAuthorizationController *)controller { return self.window; }
- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithAuthorization:(ASAuthorization *)authorization {
    @synchronized([Shidai3AppleCredential class]) {
        if (S3AppleActive != self || self.controller != controller) return;
        if (!self.valid) { S3AppleRelease(self); return; }
        NSString *status = @"failed", *token = nil, *code = nil;
        if ([authorization.credential isKindOfClass:[ASAuthorizationAppleIDCredential class]]) {
            ASAuthorizationAppleIDCredential *credential = (ASAuthorizationAppleIDCredential *)authorization.credential;
            if ([credential.state isEqualToString:self.requestId] && credential.identityToken && credential.authorizationCode) {
                token = [[NSString alloc] initWithData:credential.identityToken encoding:NSUTF8StringEncoding];
                code = [[NSString alloc] initWithData:credential.authorizationCode encoding:NSUTF8StringEncoding];
                if (S3AppleOpaque(token, 16384) && S3AppleOpaque(code, 4096)) status = @"success";
            }
        }
        NSMutableDictionary *dto = [@{@"provider":@"apple", @"requestId":self.requestId, @"nonce":self.nonce, @"status":status} mutableCopy];
        if ([status isEqualToString:@"success"]) { dto[@"idToken"] = token; dto[@"authorizationCode"] = code; }
        NSData *data = [NSJSONSerialization dataWithJSONObject:dto options:0 error:nil];
        self.result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        self.controller.delegate = nil; self.controller.presentationContextProvider = nil; self.controller = nil; self.window = nil;
    }
}
- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithError:(NSError *)error {
    @synchronized([Shidai3AppleCredential class]) {
        if (S3AppleActive != self || self.controller != controller) return;
        if (!self.valid) { S3AppleRelease(self); return; }
        NSString *status = [error.domain isEqualToString:ASAuthorizationErrorDomain] && error.code == ASAuthorizationErrorCanceled ? @"cancelled" : @"failed";
        NSData *data = [NSJSONSerialization dataWithJSONObject:@{@"provider":@"apple", @"requestId":self.requestId, @"nonce":self.nonce, @"status":status} options:0 error:nil];
        self.result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        self.controller.delegate = nil; self.controller.presentationContextProvider = nil; self.controller = nil; self.window = nil;
    }
}
@end
