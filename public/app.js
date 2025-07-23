const contentDiv = document.getElementById('content');
const token = localStorage.getItem('token');
let role = localStorage.getItem('role');

// Navigation visibility
if (token) {
  document.getElementById('login-link').style.display = 'none';
  document.getElementById('register-link').style.display = 'none';
  document.getElementById('logout-link').style.display = 'inline';
  if (role === 'editor') document.getElementById('create-post-link').style.display = 'inline';
}

function showHome() {
  fetch('/api/posts')
    .then(res => res.json())
    .then(posts => {
      contentDiv.innerHTML = '<h1>Blog Posts</h1>';
      posts.forEach(post => {
        contentDiv.innerHTML += `
          <div class="post">
            <h2><a href="#post/${post.id}">${post.title}</a></h2>
            <p>${post.content.substring(0, 100)}...</p>
            <p>Posted by ${post.author}</p>
          </div>
        `;
      });
    })
    .catch(err => console.error('Error fetching posts:', err));
}

function showPost(id) {
  fetch(`/api/posts/${id}`)
    .then(res => res.json())
    .then(post => {
      contentDiv.innerHTML = `
        <h1>${post.title}</h1>
        <div>${post.content}</div>
        <p>Posted by ${post.author}</p>
        <h3>Comments</h3>
        <div id="comments"></div>
        ${token ? `
          <form id="comment-form">
            <textarea id="comment-content" required></textarea>
            <button type="submit">Add Comment</button>
          </form>
        ` : '<p>Login to comment</p>'}
      `;
      loadComments(id);
      if (token) {
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
          commentForm.addEventListener('submit', e => {
            e.preventDefault();
            addComment(id);
          });
        } else {
          console.error('Comment form not found');
        }
      }
    })
    .catch(err => console.error('Error fetching post:', err));
}

function loadComments(postId) {
  fetch(`/api/comments/${postId}`)
    .then(res => res.json())
    .then(comments => {
      const commentsDiv = document.getElementById('comments');
      commentsDiv.innerHTML = '';
      comments.forEach(comment => {
        commentsDiv.innerHTML += `
          <div class="comment">
            <p>${comment.content}</p>
            <p>By User ${comment.author}</p>
            ${token && role === 'editor' ? `<button onclick="deleteComment(${comment.id}, ${postId})">Delete</button>` : ''}
          </div>
        `;
      });
    })
    .catch(err => console.error('Error fetching comments:', err));
}

function addComment(postId) {
  const content = document.getElementById('comment-content').value;
  fetch('/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ postId, content })
  })
    .then(res => res.json())
    .then(() => {
      loadComments(postId);
      document.getElementById('comment-content').value = '';
    })
    .catch(err => console.error('Error adding comment:', err));
}

function deleteComment(commentId, postId) {
  fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(() => loadComments(postId))
    .catch(err => console.error('Error deleting comment:', err));
}

function showLogin() {
  contentDiv.innerHTML = `
    <h1>Login</h1>
    <form id="login-form">
      <input type="text" id="login-username" placeholder="Username" required>
      <input type="password" id="login-password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `;
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      login();
    });
  } else {
    console.error('Login form not found');
  }
}

function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        window.location.hash = 'home';
        location.reload();
      } else {
        alert('Login failed: ' + data.message);
      }
    })
    .catch(err => console.error('Error logging in:', err));
}

function showRegister() {
  contentDiv.innerHTML = `
    <h1>Register</h1>
    <form id="register-form">
      <input type="text" id="register-username" placeholder="Username" required>
      <input type="password" id="register-password" placeholder="Password" required>
      <select id="register-role">
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
      </select>
      <input type="password" id="editor-password" placeholder="Editor Password" style="display: none;">
      <button type="submit">Register</button>
    </form>
  `;
  
  const roleSelect = document.getElementById('register-role');
  const editorPasswordInput = document.getElementById('editor-password');
  
  if (roleSelect && editorPasswordInput) {
    roleSelect.addEventListener('change', () => {
      if (roleSelect.value === 'editor') {
        editorPasswordInput.style.display = 'block';
        editorPasswordInput.required = true;
      } else {
        editorPasswordInput.style.display = 'none';
        editorPasswordInput.required = false;
      }
    });
  } else {
    console.error('Role select or editor password input not found');
  }
  
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      register();
    });
  } else {
    console.error('Register form not found');
  }
}

function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;
  const editorPassword = document.getElementById('editor-password').value;
  
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role, editorPassword })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message === 'User registered') {
        window.location.hash = 'login';
      } else {
        alert('Registration failed: ' + data.message);
      }
    })
    .catch(err => console.error('Error registering:', err));
}

function showCreatePost() {
  contentDiv.innerHTML = `
    <h1>Create Post</h1>
    <input type="text" id="post-title" placeholder="Title" required>
    <div id="editor"></div>
    <button id="submit-post">Publish</button>
  `;
  const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: [['bold', 'italic', 'underline'], ['link', 'image']]
    }
  });
  document.getElementById('submit-post').addEventListener('click', () => {
    const title = document.getElementById('post-title').value;
    const content = quill.root.innerHTML;
    createPost(title, content);
  });
}

function createPost(title, content) {
  fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  })
    .then(res => res.json())
    .then(post => {
      window.location.hash = `post/${post.id}`;
    })
    .catch(err => console.error('Error creating post:', err));
}

function showAbout() {
  contentDiv.innerHTML = `
    <h1>About Us</h1>
    <div class="about-box">
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p>Social Links: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    </div>
  `;
}

window.addEventListener('hashchange', handleRoute);
handleRoute();

function handleRoute() {
  const hash = window.location.hash.slice(1) || 'home';
  console.log('Navigating to:', hash);
  if (hash === 'home') showHome();
  else if (hash === 'login') showLogin();
  else if (hash === 'register') showRegister();
  else if (hash === 'about') showAbout();
  else if (hash === 'create-post' && role === 'editor') showCreatePost();
  else if (hash.startsWith('post/')) showPost(hash.split('/')[1]);
}

document.getElementById('logout-link').addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  window.location.hash = 'home';
  location.reload();
});
