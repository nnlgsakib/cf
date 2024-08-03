document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('usersubmit').addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const userkey = document.getElementById('userkey').value;
        if (username && userkey) {
            chrome.storage.sync.set({ [userkey]: username }, () => {
                alert('User data saved successfully!');
            });
        } else {
            alert('Please enter both username and userkey.');
        }
    });

    document.getElementById('groupsubmit').addEventListener('click', () => {
        const grouplink = document.getElementById('grouplink').value;
        const groupkey = document.getElementById('groupkey').value;
        if (grouplink && groupkey) {
            chrome.storage.sync.set({ [groupkey]: grouplink }, () => {
                alert('Group data saved successfully!');
            });
        } else {
            alert('Please enter both grouplink and groupkey.');
        }
    });

    document.getElementById('passwordsubmit').addEventListener('click', () => {
        const commonPassword = document.getElementById('commonpassword').value;
        if (commonPassword) {
            chrome.storage.sync.set({ commonPassword: commonPassword }, () => {
                alert('Common password set successfully!');
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "updatePassword", password: commonPassword});
                });
            });
        } else {
            alert('Please enter a common password.');
        }
    });

    document.getElementById('toggle-switch').addEventListener('change', (event) => {
        const state = event.target.checked;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "updateMessageContent", state: state});
        });
    });

    // Load the current common password
    chrome.storage.sync.get('commonPassword', function(data) {
        if (data.commonPassword) {
            document.getElementById('commonpassword').value = data.commonPassword;
        }
    });
});