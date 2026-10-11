#import <UIKit/UIKit.h>
#import <Security/Security.h>
#include <cstring>
#ifndef SHIDAI3_GOOGLE_CREDENTIAL
#define SHIDAI3_GOOGLE_CREDENTIAL 0
#endif
#if SHIDAI3_GOOGLE_CREDENTIAL
#import <GoogleSignIn/GoogleSignIn.h>
#endif

// Optional GoogleSignIn10.0.0 DEVELOPMENT transport. No SDK initialization at load time.
@interface Shidai3GoogleRequest : NSObject
@property(nonatomic, copy) NSString *requestId;
@property(nonatomic, copy) NSString *nonce;
@property(nonatomic, copy) NSString *result;
@property(nonatomic) BOOL valid;
@property(nonatomic) BOOL inFlight;
@end
@implementation Shidai3GoogleRequest
@end
@interface Shidai3GoogleCredential : NSObject
+ (void)configure:(UIViewController *)controller clientId:(NSString *)clientId serverClientId:(NSString *)serverClientId enabled:(BOOL)enabled;
+ (BOOL)isConfigured;
+ (NSString *)nonce;
+ (BOOL)begin:(NSString *)requestId nonce:(NSString *)nonce;
+ (NSString *)poll:(NSString *)requestId;
+ (BOOL)cancel:(NSString *)requestId;
@end
static __weak UIViewController *S3GoogleHost;
static NSString *S3GoogleClientId, *S3GoogleServerClientId;
static BOOL S3GoogleEnabled = NO;
static Shidai3GoogleRequest *S3GoogleActive;
static BOOL S3GoogleRandom(NSString *value) {
    return value.length == 64 && [value rangeOfCharacterFromSet:[[NSCharacterSet characterSetWithCharactersInString:@"abcdef0123456789"] invertedSet]].location == NSNotFound;
}
static void S3GoogleRelease(Shidai3GoogleRequest *request) {
    request.valid = NO; request.result = nil; request.requestId = nil; request.nonce = nil;
    if (S3GoogleActive == request) S3GoogleActive = nil;
}
@implementation Shidai3GoogleCredential
+ (void)configure:(UIViewController *)controller clientId:(NSString *)clientId serverClientId:(NSString *)serverClientId enabled:(BOOL)enabled {
    @synchronized(self) {
        if (S3GoogleActive.valid) [self cancel:S3GoogleActive.requestId];
        S3GoogleHost = controller; S3GoogleClientId = clientId; S3GoogleServerClientId = serverClientId;
        S3GoogleEnabled = enabled && clientId.length > 0 && clientId.length <= 256 && serverClientId.length > 0 && serverClientId.length <= 256;
    }
}
+ (BOOL)isConfigured {
    @synchronized(self) {
#if SHIDAI3_GOOGLE_CREDENTIAL
        return S3GoogleEnabled && S3GoogleHost != nil;
#else
        return NO;
#endif
    }
}
+ (NSString *)nonce {
    unsigned char bytes[32];
    if (SecRandomCopyBytes(kSecRandomDefault, sizeof(bytes), bytes) != errSecSuccess) return @"";
    NSMutableString *hex = [NSMutableString stringWithCapacity:64];
    for (NSUInteger i = 0; i < sizeof(bytes); i++) [hex appendFormat:@"%02x", bytes[i]];
    memset(bytes, 0, sizeof(bytes)); return hex;
}
+ (BOOL)begin:(NSString *)requestId nonce:(NSString *)nonce {
    @synchronized(self) {
        if (![self isConfigured] || S3GoogleActive || !S3GoogleRandom(requestId) || !S3GoogleRandom(nonce) || [requestId isEqualToString:nonce]) return NO;
        Shidai3GoogleRequest *request = [Shidai3GoogleRequest new];
        request.valid = YES; request.requestId = requestId; request.nonce = nonce; S3GoogleActive = request;
        dispatch_async(dispatch_get_main_queue(), ^{
            @synchronized(self) {
                if (S3GoogleActive != request) return;
                if (!request.valid || ![self isConfigured]) { S3GoogleRelease(request); return; }
#if SHIDAI3_GOOGLE_CREDENTIAL
                request.inFlight = YES;
                GIDSignIn *sdk = [GIDSignIn sharedInstance];
                sdk.configuration = [[GIDConfiguration alloc] initWithClientID:S3GoogleClientId serverClientID:S3GoogleServerClientId];
                [sdk signInWithPresentingViewController:S3GoogleHost hint:nil additionalScopes:nil nonce:request.nonce completion:^(GIDSignInResult *result, NSError *error) {
                    @synchronized(self) {
                        if (S3GoogleActive != request) return;
                        request.inFlight = NO;
                        if (!request.valid) { S3GoogleRelease(request); return; }
                        NSString *status = @"failed", *token = nil;
                        if (!error) {
                            token = result.user.idToken.tokenString;
                            NSMutableCharacterSet *bad = [[NSCharacterSet whitespaceAndNewlineCharacterSet] mutableCopy];
                            [bad formUnionWithCharacterSet:[NSCharacterSet controlCharacterSet]];
                            if (token.length > 0 && token.length <= 16384 && [token rangeOfCharacterFromSet:bad].location == NSNotFound) status = @"success";
                        } else if ([error.domain isEqualToString:kGIDSignInErrorDomain] && error.code == kGIDSignInErrorCodeCanceled) status = @"cancelled";
                        NSMutableDictionary *dto = [@{@"provider":@"google", @"requestId":request.requestId, @"nonce":request.nonce, @"status":status} mutableCopy];
                        if ([status isEqualToString:@"success"]) dto[@"idToken"] = token;
                        NSData *data = [NSJSONSerialization dataWithJSONObject:dto options:0 error:nil];
                        request.result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                    }
                }];
#endif
            }
        });
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 60 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
            @synchronized(self) { if (S3GoogleActive == request && request.valid) [self cancel:request.requestId]; }
        });
        return YES;
    }
}
+ (NSString *)poll:(NSString *)requestId {
    @synchronized(self) {
        if (!S3GoogleActive.valid || ![S3GoogleActive.requestId isEqualToString:requestId] || !S3GoogleActive.result) return @"";
        NSString *result = S3GoogleActive.result; S3GoogleRelease(S3GoogleActive); return result;
    }
}
+ (BOOL)cancel:(NSString *)requestId {
    @synchronized(self) {
        Shidai3GoogleRequest *request = S3GoogleActive;
        if (!request.valid || ![request.requestId isEqualToString:requestId]) return NO;
        request.valid = NO; request.result = nil; request.requestId = nil; request.nonce = nil;
        if (!request.inFlight) S3GoogleRelease(request);
        // No public request-cancel API. Keep busy until callback; never use signOut/disconnect.
        return YES;
    }
}
@end
