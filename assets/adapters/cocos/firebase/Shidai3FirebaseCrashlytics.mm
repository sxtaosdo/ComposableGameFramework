#import <Foundation/Foundation.h>
#import <FirebaseCore/FirebaseCore.h>
#import <FirebaseCrashlytics/FirebaseCrashlytics.h>

/** Optional DEVELOPMENT reflection source; exclude SDK/class from default builds. Xcode unverified. */
@interface Shidai3FirebaseCrashlytics : NSObject
+ (BOOL)configure:(BOOL)allowAutomaticCapture upload:(BOOL)allowUpload;
+ (BOOL)isConfigured;
+ (BOOL)disable;
+ (BOOL)record:(NSString *)json;
@end

@implementation Shidai3FirebaseCrashlytics
static FIRCrashlytics *S3CrashSDK = nil;
static BOOL S3CrashEnabled = NO;
+ (BOOL)configure:(BOOL)allowAutomaticCapture upload:(BOOL)allowUpload {
    @synchronized(self) {
        S3CrashEnabled = NO;
        if (S3CrashSDK != nil) [S3CrashSDK setCrashlyticsCollectionEnabled:NO];
        if (!allowAutomaticCapture || !allowUpload || [FIRApp defaultApp] == nil) return NO;
        S3CrashSDK = [FIRCrashlytics crashlytics];
        [S3CrashSDK setCrashlyticsCollectionEnabled:NO];
        [S3CrashSDK setCrashlyticsCollectionEnabled:YES];
        S3CrashEnabled = YES;
        return YES;
    }
}
+ (BOOL)isConfigured { @synchronized(self) { return S3CrashEnabled && S3CrashSDK != nil; } }
+ (BOOL)disable {
    @synchronized(self) {
        S3CrashEnabled = NO;
        if (S3CrashSDK != nil) [S3CrashSDK setCrashlyticsCollectionEnabled:NO];
        return YES; // Request only; automatic native capture is not uninstalled.
    }
}
+ (BOOL)record:(NSString *)json {
    @synchronized(self) {
        if (![self isConfigured] || ![json isKindOfClass:[NSString class]] || json.length > 256) return NO;
        id input = [NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
        if (![input isKindOfClass:[NSDictionary class]] || [input count] != 2) return NO;
        NSArray *codes = @[@"js_uncaught", @"promise_unhandled", @"resource_failed", @"network_failed", @"save_failed", @"black_screen", @"stalled"];
        NSArray *operations = @[@"boot", @"resource", @"network", @"save", @"gameplay", @"switch"];
        if (![input[@"code"] isKindOfClass:[NSString class]] || ![input[@"operation"] isKindOfClass:[NSString class]]) return NO;
        NSUInteger index = [codes indexOfObject:input[@"code"]];
        if (index == NSNotFound || ![operations containsObject:input[@"operation"]]) return NO;
        NSError *error = [NSError errorWithDomain:@"com.shidai3.diagnostic" code:(NSInteger)index + 1
            userInfo:@{@"operation":input[@"operation"]}];
        [S3CrashSDK recordError:error]; // SDK also captures this native thread's call stack.
        return YES;
    }
}
@end
