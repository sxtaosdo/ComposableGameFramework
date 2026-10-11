#import <Foundation/Foundation.h>
#import <FirebaseCore/FirebaseCore.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>
#import <math.h>

/** Fixed reflection source for DEVELOPMENT only; production Apple bridge choice is still unverified. */
@interface Shidai3FirebaseAnalytics : NSObject
+ (BOOL)configure:(BOOL)allowCollection;
+ (BOOL)isConfigured;
+ (BOOL)submit:(NSString *)name parameters:(NSString *)json;
@end

@implementation Shidai3FirebaseAnalytics
static BOOL S3AnalyticsEnabled = NO;
+ (BOOL)configure:(BOOL)allowCollection {
    @synchronized(self) {
        S3AnalyticsEnabled = NO;
        @try {
            if ([FIRApp defaultApp] == nil) return NO; // No implicit Firebase configure.
            // SDK collection may have a persisted override even when this class's gate starts at NO.
            [FIRAnalytics setAnalyticsCollectionEnabled:NO];
            if (!allowCollection) return NO;
            [FIRAnalytics setAnalyticsCollectionEnabled:YES];
            S3AnalyticsEnabled = YES;
            return YES;
        } @catch (NSException *failure) { return NO; }
    }
}
+ (BOOL)isConfigured { @synchronized(self) { return S3AnalyticsEnabled && [FIRApp defaultApp] != nil; } }
+ (BOOL)submit:(NSString *)name parameters:(NSString *)json {
    @synchronized(self) {
        if (![self isConfigured] || json == nil || json.length > 8192) return NO;
        NSDictionary<NSString *, NSArray<NSString *> *> *fields = @{
            @"session_started": @[@"entry"], @"session_ready": @[@"durationMs"],
            @"level_started": @[@"levelId", @"mode"], @"level_finished": @[@"levelId", @"outcome", @"durationMs"],
            @"region_entered": @[@"regionId"], @"encounter_started": @[@"encounterId"],
            @"encounter_finished": @[@"encounterId", @"outcome"], @"item_used": @[@"itemId", @"quantity", @"commitState"],
            @"currency_changed": @[@"currency", @"before", @"after", @"delta", @"reason", @"commitState"],
            @"ad_shown": @[@"placementId"], @"ad_video_completed": @[@"placementId", @"completed"],
            @"ad_reward_committed": @[@"placementId", @"rewardType", @"rewardCode", @"amount", @"commitState"],
            @"save_failed": @[@"operation", @"code"], @"save_recovered": @[@"operation"],
            @"invite_presented": @[@"target"], @"invite_accepted": @[@"target"],
            @"gameplay_switch_completed": @[@"from", @"to"], @"diagnostic_error": @[@"code", @"operation"] };
        NSArray<NSString *> *eventFields = fields[name];
        if (eventFields == nil) return NO;
        id decoded = [NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
        if (![decoded isKindOfClass:[NSDictionary class]]) return NO;
        NSDictionary *input = decoded;
        NSArray *context = @[@"schemaVersion", @"kind", @"timestampMs", @"product", @"gameplay", @"environment", @"platform", @"sessionId", @"release", @"commit", @"buildId", @"factId"];
        if (input.count > 25 || ![input[@"platform"] isEqual:@"native"] || ![input[@"schemaVersion"] isEqual:@1]
            || ![input[@"kind"] isEqual:[name isEqual:@"diagnostic_error"] ? @"error" : @"event"]) return NO;
        NSMutableSet *allowed = [NSMutableSet setWithArray:context];
        [allowed addObjectsFromArray:eventFields]; [allowed addObject:@"causationId"];
        for (NSString *key in context) if (input[key] == nil) return NO;
        for (NSString *key in eventFields) if (input[key] == nil) return NO;
        if ([name isEqual:@"ad_reward_committed"] && input[@"causationId"] == nil) return NO;
        NSRegularExpression *safe = [NSRegularExpression regularExpressionWithPattern:@"^[A-Za-z0-9_.:-]{1,100}$" options:0 error:nil];
        for (id key in input) {
            if (![allowed containsObject:key]) return NO;
            id value = input[key];
            if ([value isKindOfClass:[NSString class]]) {
                if ([safe numberOfMatchesInString:value options:0 range:NSMakeRange(0, [value length])] != 1) return NO;
            } else if ([value isKindOfClass:[NSNumber class]]) {
                double number = [value doubleValue];
                if (!isfinite(number) || floor(number) != number || fabs(number) > 9007199254740991.0) return NO;
            } else return NO;
        }
        [FIRAnalytics logEventWithName:name parameters:input];
        return YES; // Local SDK submission, not remote reception.
    }
}
@end
