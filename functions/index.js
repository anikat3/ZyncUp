exports.checkNotifications = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const now = new Date();
  const notificationsRef = admin.firestore().collection('notifications');
  
  // Get notifications that are due in the next 5 minutes
  const query = notificationsRef
    .where('status', '==', 'pending')
    .where('notificationTime', '<=', new Date(now.getTime() + 5 * 60000));
    
  const notifications = await query.get();
  
  notifications.forEach(async (notification) => {
    const data = notification.data();
    
    // Send notifications to all members (implement your notification method here)
    for (const memberEmail of data.members) {
      // Send email/push notification to member
      await sendNotification(memberEmail, {
        title: 'Upcoming Meeting',
        body: `You have a meeting in 30 minutes with your group "${data.groupName}"`,
        // Add other notification details
      });
    }
    
    // Update notification status
    await notification.ref.update({ status: 'sent' });
  });
}); 