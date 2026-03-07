/plan we will have new module called notifcation service, it will have multiple providers like telegram, discord, but for now only telegram, it will send message to telegram ( will provide bot_token and chat_id in config/env )
then every time we create/update a task -> publish a job ( should be bullmq )
we will have new processor to process task update job

update plan, let use DiscoveryService, add decorator NotificationProvider to telegram

could we add more notification provider, it should be consoleprovider
