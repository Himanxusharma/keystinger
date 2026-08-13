// KeyStinger Manifest V3 Service Worker (Phase 1, 2 & 3)

chrome.runtime.onInstalled.addListener(() => {
  console.log("KeyStinger extension installed successfully.");

  // Register Context Menu Item for highlighted text selection
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: "keystinger_validate_selection",
      title: "Validate Key with KeyStinger",
      contexts: ["selection"]
    });
  }

  // Register 24-hour background health check alarm
  if (chrome.alarms) {
    chrome.alarms.create("keystinger_daily_health_check", {
      periodInMinutes: 1440 // 24 hours
    });
  }
});

// Context Menu Click Listener
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "keystinger_validate_selection" && info.selectionText) {
      const selectedKey = info.selectionText.trim();
      console.log("KeyStinger Context Menu triggered with selection:", selectedKey.slice(0, 8));

      // Flash badge notification to acknowledge action to user
      if (chrome.action) {
        chrome.action.setBadgeText({ text: "CHECK" });
        chrome.action.setBadgeBackgroundColor({ color: "#F59E0B" });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 4000);
      }
    }
  });
}

// Background Health Check Alarm Listener
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keystinger_daily_health_check") {
      console.log("Executing background KeyStinger key health audit alarm...");
      // Service worker can audit chrome.storage.local keys in background
    }
  });
}
