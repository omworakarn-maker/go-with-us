import Foundation
import UserNotifications

final class MessagePoller: ObservableObject {
    static let shared = MessagePoller()

    private var timer: Timer?
    // Keep last seen message id per conversation to detect new messages
    private var lastMessageIds: [String: String] = [:]
    // Use persistent last-seen message id per partner to detect new messages across launches
    private func lastSeenMessageId(for partnerId: String) -> String? {
        return UserDefaults.standard.string(forKey: "lastSeenMessageId_\(partnerId)")
    }

    private func setLastSeenMessageId(_ id: String?, for partnerId: String) {
        let key = "lastSeenMessageId_\(partnerId)"
        if let id = id {
            UserDefaults.standard.set(id, forKey: key)
        } else {
            UserDefaults.standard.removeObject(forKey: key)
        }
    }
    private init() {}

    // Public API: mark a conversation as seen up to a specific message id
    func markConversationSeen(partnerId: String, messageId: String?) {
        setLastSeenMessageId(messageId, for: partnerId)
        if let mid = messageId {
            lastMessageIds[partnerId] = mid
        } else {
            lastMessageIds.removeValue(forKey: partnerId)
        }
        print("🔁 MessagePoller: marked seen for \(partnerId) = \(messageId ?? "nil")")
    }

    func startPolling() {
        guard !AppRuntime.isRunningForPreview else { return }

        stopPolling()
        checkConversations()
        timer = Timer.scheduledTimer(withTimeInterval: 8.0, repeats: true) { [weak self] _ in
            self?.checkConversations()
        }
    }

    func stopPolling() {
        timer?.invalidate()
        timer = nil
    }

    func checkConversations() {
        guard !AppRuntime.isRunningForPreview else { return }

        Task {
            do {
                let conversations = try await MessageService.shared.getConversations()
                let totalUnread = conversations.compactMap { $0.unreadCount }.reduce(0, +)
                // Ensure UI updates and notifications happen on main thread
                await MainActor.run {
                    print("🔎 MessagePoller: found \(conversations.count) conversations, totalUnread=\(totalUnread)")

                    // Detect new messages per conversation and post incremental events
                    let currentUserId = AuthService.shared.getCurrentUserId()
                    for conv in conversations {
                        let partnerId = conv.user.id
                        let lastMsgId = conv.lastMessage.id

                        // Persistent seen id (set when user opens chat)
                        let persistedSeenId = lastSeenMessageId(for: partnerId)

                        var shouldNotify = false

                        if let persisted = persistedSeenId {
                            // If persisted seen id differs from last message id -> new
                            if persisted != lastMsgId {
                                // Only notify if the last message was sent by the other user
                                if conv.lastMessage.senderId != currentUserId {
                                    shouldNotify = true
                                }
                            }
                        } else if let seenId = lastMessageIds[partnerId] {
                            // Fallback to in-memory cache if no persisted seen id
                            if seenId != lastMsgId {
                                if conv.lastMessage.senderId != currentUserId {
                                    shouldNotify = true
                                }
                            }
                        } else {
                            // No persisted or in-memory seen id: initialize cache but do not notify on first load
                        }

                        if shouldNotify {
                            print("🆕 MessagePoller: new message from \(conv.user.name) (\(partnerId)) id=\(lastMsgId)")
                            // Post conversation event for UI optimistic update
                            NotificationCenter.default.post(name: NSNotification.Name("ConversationNewMessage"), object: nil, userInfo: ["partnerId": partnerId, "messageId": lastMsgId])

                            // Schedule a local notification so user sees a banner even if app is foreground
                            let content = UNMutableNotificationContent()
                            content.title = "ข้อความใหม่จาก \(conv.user.name)"
                            // Truncate body to reasonable length
                            let bodyText = conv.lastMessage.content
                            content.body = bodyText.count > 120 ? String(bodyText.prefix(120)) + "…" : bodyText
                            content.sound = .default
                            content.userInfo = ["partnerId": partnerId, "messageId": lastMsgId]

                            // Create a unique identifier to avoid duplicates
                            let request = UNNotificationRequest(identifier: "message_\(lastMsgId)", content: content, trigger: nil)
                            UNUserNotificationCenter.current().add(request) { err in
                                if let err = err {
                                    print("❌ Failed to schedule local notification: \(err)")
                                } else {
                                    print("✅ Scheduled local notification for message \(lastMsgId)")
                                }
                            }
                        }

                        // Update in-memory cache
                        lastMessageIds[partnerId] = lastMsgId
                    }

                    // Update app badge using UNUserNotificationCenter (iOS 17+)
                    UNUserNotificationCenter.current().setBadgeCount(totalUnread) { error in
                        if let err = error {
                            print("❌ Failed to set badge: \(err)")
                        }
                    }

                    // Notify app to refresh UI (Chat lists, tabbar)
                    NotificationCenter.default.post(name: NSNotification.Name("NewMessageReceived"), object: nil)
                }
            } catch {
                // Silently ignore
            }
        }
    }
}
