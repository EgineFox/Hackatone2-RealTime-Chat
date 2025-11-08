const socket = io('http://localhost:5000', {
  withCredentials: true
});

// Local user info
const username = localStorage.getItem('chat_username');
const avatar = localStorage.getItem('chat_avatar') || '/avatars/default.jpg';

// State
let allUsers = [];
let onlineUsernames = [];
let activeChatUser = null;
const contacts = {}; // { username: { lastMessage: '', isTyping: false } }

// DOM elements
const sendBtn = document.getElementById('sendBtn');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const userList = document.getElementById('userList');
const header = document.getElementById('chatHeaderName');
const avatarSmall = document.querySelector('.status__avatar--small img');

// Register current user with socket
socket.emit('register', { username, avatar });
console.log('Registering user:', username, avatar);

// Load current user info
async function loadCurrentUser() {
  if (!username) {
    console.warn('Username not found in localStorage');
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/users/${username}`);
    if (!res.ok) {
      const text = await res.text();
      console.error('Server response error:', res.status, text);
      return;
    }

    const user = await res.json();
    console.log('Current user:', user);

    const avatarUrl = user.avatar_url?.startsWith('/') || user.avatar_url?.startsWith('http')
      ? user.avatar_url
      : `/avatars/${user.avatar_url}`;

    const currentUserBlock = document.getElementById('currentUser');
    if (currentUserBlock) {
      const avatarImg = currentUserBlock.querySelector('.status__avatar img');
      const nameBlock = currentUserBlock.querySelector('.meta__name');
      if (avatarImg) avatarImg.src = avatarUrl;
      if (nameBlock) nameBlock.textContent = username;
    }

    if (avatarSmall) {
      avatarSmall.src = avatarUrl;
    }
  } catch (err) {
    console.error('Failed to load current user:', err);
  }
}

// Load all users from server
async function loadUserList() {
  try {
    const res = await fetch('http://localhost:5000/api/users');
    const dbUsers = await res.json();

    const allUsernames = dbUsers.map(u => u.username);
    const extraOnlineUsers = onlineUsernames
      .filter(name => !allUsernames.includes(name))
      .map(name => ({ username: name, avatar_url: '/avatars/default.jpg' }));

    allUsers = [...dbUsers, ...extraOnlineUsers];

    const sortedUsers = [
      ...allUsers.filter(user =>
        onlineUsernames.some(name => name.toLowerCase() === user.username.toLowerCase())
      ),
      ...allUsers.filter(user =>
        !onlineUsernames.some(name => name.toLowerCase() === user.username.toLowerCase())
      )
    ];

    allUsers = sortedUsers;
    updateContactList(sortedUsers);

    userList.innerHTML = '';
    sortedUsers.forEach(user => {
      if (user.username === username) return;

      const isOnline = onlineUsernames.some(name => name.toLowerCase() === user.username.toLowerCase());
      const li = document.createElement('li');
      li.dataset.username = user.username;

      const status = document.createElement('div');
      status.className = 'status';

      const avatarImg = document.createElement('img');
      avatarImg.src = user.avatar_url || '/avatars/default.jpg';
      avatarImg.className = isOnline ? 'avatar-color' : 'avatar-gray';

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = `<div class="meta__name">${user.username}</div>`;

      const figure = document.createElement('figure');
      figure.className = 'status__avatar';
      figure.appendChild(avatarImg);

      status.appendChild(figure);
      status.appendChild(meta);
      li.appendChild(status);
      userList.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load user list:', err);
  }
}

// Open private chat with selected user
async function openPrivateChat(targetUsername) {
  activeChatUser = targetUsername;
  header.textContent = `Chat with ${targetUsername}`;
  messages.innerHTML = '';
  
  const history = sessionMessages[targetUsername] || [];
  history.forEach(msg => renderMessage(msg));
};
 

// Handle user selection
userList.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-username]');
  if (!li) return;

  const selectedUsername = li.dataset.username;
  if (!selectedUsername) return;

  [...userList.children].forEach(item => item.classList.remove('selected'));
  li.classList.add('selected');

  openPrivateChat(selectedUsername);
});

// Send message
sendBtn.addEventListener('click', () => {
  const msg = input.value.trim();
  if (msg && activeChatUser) {
    socket.emit('private message', {
      to: activeChatUser,
      message: msg
    });
    const messageData = { from: username, message: msg, avatar };
    if (!sessionMessages[activeChatUser]) sessionMessages[activeChatUser] = [];
    sessionMessages[activeChatUser].push(messageData);

    renderMessage(messageData);

    if (!contacts[activeChatUser]) contacts[activeChatUser] = {};
    contacts[activeChatUser].lastMessage = msg;
    contacts[activeChatUser].isTyping = false;

    updateContactList();
    input.value = '';
  }
  console.log('Emitting private message:', { to: activeChatUser, message: msg });
});

// Send on Enter
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendBtn.click();
  }
});

// Typing status
let typingTimeout;
input.addEventListener('input', () => {
  if (activeChatUser) {
    socket.emit('typing', { to: activeChatUser });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stop typing', { to: activeChatUser });
    }, 1000);
  }
});

// Receive online list
socket.on('online list', (list) => {
  onlineUsernames = list;
  console.log('Online users:', onlineUsernames);
  loadUserList(); // 
});

// Receive private message
const sessionMessages = [];
socket.on('private message', ({ from, message, avatar }) => {
  if (!sessionMessages[from]) sessionMessages[from] = [];
  sessionMessages[from].push({ from, message, avatar });
  if (activeChatUser === from) {
    renderMessage({ from, message, avatar });
  }

  if (from !== activeChatUser) {
    contacts[from].hasUnread = true;
  }
  updateContactList();
}
);

// Receive typing status
socket.on('typing', ({ from }) => {
  if (!contacts[from]) contacts[from] = {};
  contacts[from].isTyping = true;
  updateContactList();
});

socket.on('stop typing', ({ from }) => {
  if (!contacts[from]) contacts[from] = {};
  contacts[from].isTyping = false;
  updateContactList();
});

// Render message bubble
function renderMessage({ from, message, avatar }) {
  const div = document.createElement('div');
  const isMine = from === username;

  const avatarUrl = avatar && (avatar.startsWith('http') || avatar.startsWith('/'))
    ? avatar
    : '/avatars/default.jpg';

  if (isMine) {
    div.className = 'message--send';
    div.innerHTML = `
      <div class="message__bubble--send">${message}</div>
      <figure class="message__avatar">
        <img src="${avatarUrl}" alt="My avatar" />
      </figure>
    `;
  } else {
    div.className = 'message';
    div.innerHTML = `
      <figure class="message__avatar">
        <img src="${avatarUrl}" alt="Sender avatar" />
      </figure>
      <div class="message__bubble">${message}</div>
    `;
  }

  messages.appendChild(div);
  messages.appendChild(document.createElement('div')).className = 'cf';
  messages.scrollTop = messages.scrollHeight;
}

// Update contact list
function updateContactList(usersArray = allUsers) {
  const list = document.getElementById('userList');
  list.innerHTML = '';

  usersArray.forEach(user => {
    if (!user || !user.username || user.username === username) return;

    const contact = contacts[user.username] || {};

    // Determine online status
    const isOnline = onlineUsernames.some(
      name => name.toLowerCase() === user.username.toLowerCase()
    );

    // Choose the last message text
    const lastLine = contact.isTyping
      ? 'typing…'
      : contact.hasUnread
        ? 'New message'
        : contact.lastMessage || '';

    // Class for unread messages
    const unreadClass = contact.hasUnread ? 'unread' : '';

    // Avatar class based on online status
    const avatarClass = isOnline ? 'avatar-color' : 'avatar-gray';
    const avatarUrl = user.avatar_url || '/avatars/default.jpg';

    const li = document.createElement('li');
    li.className = `contact-item ${unreadClass}`;
    li.dataset.username = user.username;

    li.innerHTML = `
      <div class="status">
        <figure class="status__avatar">
          <img src="${avatarUrl}" class="${avatarClass}" />
        </figure>
        <div class="meta">
          <div class="meta__name">${user.username}</div>
          <div class="meta__last">${lastLine}</div>
        </div>
      </div>
    `;

    list.appendChild(li);
  });
}


// Initial load
document.addEventListener('DOMContentLoaded', () => {
  loadUserList();
  loadCurrentUser();
});