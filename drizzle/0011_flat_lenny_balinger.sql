CREATE TABLE `funnelConditionalRoutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`fromStepKey` varchar(50) NOT NULL,
	`toStepKey` varchar(50) NOT NULL,
	`conditions` text NOT NULL,
	`conditionLogic` enum('and','or') NOT NULL DEFAULT 'and',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnelConditionalRoutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnelStepEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`stepKey` varchar(50) NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`funnelStepEventType` enum('step_view','step_complete','step_skip','form_submit','button_click') NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnelStepEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnelSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`stepKey` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`funnelStepType` enum('content','form','quiz','checkout','calendar','thank-you') NOT NULL DEFAULT 'content',
	`sortOrder` int NOT NULL DEFAULT 0,
	`puckData` text,
	`draftPuckData` text,
	`settings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnelSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnelSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`data` text,
	`completedSteps` text,
	`quizAnswers` text,
	`leadScore` int DEFAULT 0,
	`ghlSynced` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnelSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnelTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`thumbnail` varchar(500),
	`snapshot` text NOT NULL,
	`isSystem` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnelTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnelVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`version` int NOT NULL,
	`snapshot` text NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnelVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`funnelStatus` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`settings` text,
	`version` int NOT NULL DEFAULT 1,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnels_id` PRIMARY KEY(`id`),
	CONSTRAINT `funnels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`leadSource` enum('masterclass','early_capture','quiz_complete') NOT NULL,
	`leadStatus` enum('new','contacted','qualified','converted') NOT NULL DEFAULT 'new',
	`leadBusinessName` varchar(255),
	`leadBusinessType` varchar(255),
	`practiceType` varchar(255),
	`leadWebsite` varchar(500),
	`leadBiggestFrustration` text,
	`roadmapId` int,
	`leadMetadata` text,
	`leadCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`leadUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `muxAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`muxAssetId` varchar(255) NOT NULL,
	`playbackId` varchar(255),
	`muxAssetStatus` enum('preparing','ready','errored') NOT NULL DEFAULT 'preparing',
	`captionStatus` enum('generating','ready','none'),
	`duration` int,
	`filename` varchar(500),
	`title` varchar(255),
	`uploadId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `muxAssets_id` PRIMARY KEY(`id`),
	CONSTRAINT `muxAssets_muxAssetId_unique` UNIQUE(`muxAssetId`)
);
--> statement-breakpoint
CREATE TABLE `reviewAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`muxAssetId` varchar(255) NOT NULL,
	`playbackId` varchar(255),
	`filename` varchar(500),
	`title` varchar(255),
	`duration` int,
	`version` int NOT NULL DEFAULT 1,
	`parentAssetId` int,
	`changeNotes` text,
	`reviewAssetStatus` enum('pending','in-review','needs-changes','approved') NOT NULL DEFAULT 'pending',
	`uploaderName` varchar(255),
	`uploadId` varchar(255),
	`reviewMuxStatus` enum('preparing','ready','errored') NOT NULL DEFAULT 'preparing',
	`reviewAssetCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewAssetUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviewAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviewComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`parentId` int,
	`timestamp` int,
	`text` text NOT NULL,
	`author` varchar(255) NOT NULL,
	`annotation` text,
	`resolved` int NOT NULL DEFAULT 0,
	`reviewCommentCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviewComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviewProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviewProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviewShareLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`assetId` int,
	`projectId` int,
	`sharePermissions` enum('view','comment','approve') NOT NULL DEFAULT 'view',
	`expiresAt` timestamp,
	`shareCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviewShareLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviewShareLinks_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `trackingPixels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`platform` enum('facebook','google_analytics','google_tag_manager','tiktok','hyros','posthog','custom') NOT NULL,
	`pixelId` varchar(255) NOT NULL,
	`accessToken` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`pageScope` text,
	`eventMapping` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trackingPixels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`pageSlug` varchar(100) NOT NULL,
	`videoUrl` varchar(500),
	`videoEventType` enum('video_play','video_pause','video_milestone_25','video_milestone_50','video_milestone_75','video_milestone_100') NOT NULL,
	`splitTestVariant` varchar(100),
	`watchTimeSeconds` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoHeatmapViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`videoId` varchar(255) NOT NULL,
	`pageSlug` varchar(100) NOT NULL,
	`playbackVector` text,
	`seekEvents` text,
	`maxSecondReached` int DEFAULT 0,
	`totalWatchTimeSec` int DEFAULT 0,
	`videoDurationSec` int DEFAULT 0,
	`deviceType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoHeatmapViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `funnelPageContent` ADD `videoAutoplayMode` varchar(50);--> statement-breakpoint
ALTER TABLE `funnelPageContent` ADD `previewUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `funnelPageContent` ADD `headerTrackingCode` text;--> statement-breakpoint
ALTER TABLE `funnelPageContent` ADD `bodyTrackingCode` text;