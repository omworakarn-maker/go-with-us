import Foundation
import UserNotifications
import UIKit

class NotificationPoller: ObservableObject {
    static let shared = NotificationPoller()
    
    private var timer: Timer?
    private var lastChecked: Date = Date()
    @Published var unreadCount: Int = 0
    
    private init() {}
    
    func startPolling() {
        guard !AppRuntime.isRunningForPreview else { return }

        stopPolling()
        
        // Initial check
        checkNotifications()
        
        // Poll every 10 seconds
        timer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { [weak self] _ in
            self?.checkNotifications()
        }
        print("⏰ Notification Polling Started")
    }
    
    func stopPolling() {
        timer?.invalidate()
        timer = nil
    }
    
    func checkNotifications() {
        guard !AppRuntime.isRunningForPreview else { return }

        Task {
            do {
                // 1. Get unread count for badge
                let count = try await NotificationService.shared.getUnreadCount()
                
                    await MainActor.run {
                        self.unreadCount = count
                    }

                    UNUserNotificationCenter.current().setBadgeCount(count) { error in
                        if let error = error {
                            print("❌ Failed to set badge count: \(error)")
                        }
                    }
                
                // 2. Get latest notifications to see if we need to alert
                let notifications = try await NotificationService.shared.getNotifications()
                
                // Filter for new notifications (created after last checked time)
                let newNotifications = notifications.filter { notification in
                    if let date = self.date(from: notification.createdAt) {
                        return date > self.lastChecked
                    }
                    return false
                }
                
                if !newNotifications.isEmpty {
                    print("🔔 Found \(newNotifications.count) new notifications")
                    
                    if let maxDate = newNotifications.compactMap({ self.date(from: $0.createdAt) }).max() {
                        self.lastChecked = maxDate
                    } else {
                        self.lastChecked = Date()
                    }

                    for notification in newNotifications {
                        // Persist locally
                        LocalNotificationStore.shared.add(notification: notification)

                        // Trigger local notification with payload so taps can navigate
                        self.triggerLocalNotification(notification: notification)
                    }

                    // Notify app to refresh UI
                    NotificationCenter.default.post(name: NSNotification.Name("NewNotificationReceived"), object: nil)
                }
                
            } catch {
                print("⚠️ Polling Error: \(error)")
            }
        }
    }
    
    private func triggerLocalNotification(notification: AppNotification) {
        let content = UNMutableNotificationContent()
        content.title = notification.title
        content.body = notification.message
        content.sound = .default

        // Include identifying info so tap can navigate to chat/trip
        var userInfo: [AnyHashable: Any] = [:]
        userInfo["notificationId"] = notification.id
        if let target = notification.targetId { userInfo["tripId"] = target }
        // Include type for routing if provided
        userInfo["type"] = notification.type

        content.userInfo = userInfo

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil // Deliver immediately
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to add local notification: \(error)")
            } else {
                print("✅ Local Notification Scheduled: \(notification.title)")
            }
        }
    }
    
    private func date(from string: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: string)
    }
}
