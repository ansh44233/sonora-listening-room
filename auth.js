import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (s) => document.querySelector(s);
const modal = $("#auth-backdrop");
const form = $("#auth-form");
const message = $("#auth-message");
let mode = "signin";
let auth = null;\nlet db = null;\nlet cloudSyncReady = false;\nlet cloudWriteQueue = Promise.resolve();
let configured = Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("PASTE_") && firebaseConfig.projectId && !firebaseConfig.projectId.includes("YOUR_"));

function showMessage(text, error = false) {
  message.textContent = text;
  message.classList.toggle("error", error);
}
function openAuth() {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  showMessage(configured ? "" : "Connect your Firebase project to activate account sign-in.");
  $("#auth-email").focus();
}
function closeAuth() {
  modal.hidden = true;
  document.body.style.overflow = "";
}
function setMode(next) {
  mode = next;
  const signup = mode === "signup";
  $("#auth-title").textContent = signup ? "A space that's yours." : "Make room for music.";
  $("#auth-subtitle").textContent = signup ? "Create your SONORA account and verify your email." : "Sign in to keep your listening space yours.";
  $("#auth-submit").textContent = signup ? "Create account" : "Sign in";
  $("#auth-switch").firstChild.textContent = signup ? "Already have an account? " : "New to SONORA? ";
  $("#auth-switch-btn").textContent = signup ? "Sign in" : "Create an account";
  $("#auth-name").hidden = !signup;
  $("#auth-name-label").hidden = !signup;
  $("#auth-name").required = signup;
  $("#auth-password").autocomplete = signup ? "new-password" : "current-password";
  $("#auth-forgot").hidden = signup;
  showMessage("");
}
function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/user-not-found": "No account found for that email.",
    "auth/wrong-password": "That password doesn't match this account.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
    "auth/unauthorized-domain": "Add this Vercel domain to Firebase Authorized domains.",
    "auth/network-request-failed": "Network issue. Check your connection and try again."
  };
  return messages[error.code] || error.message || "Something went wrong. Please try again.";
}
function updateAccount(user) {
  const trigger = $("#auth-trigger");
  if (!user) {
    trigger.innerHTML = '<span class="account-entry-avatar">S</span><span class="account-entry-copy"><b id="account-entry-title">Sign in</b><small id="account-entry-subtitle">Your SONORA account</small></span><span class="account-entry-chevron">⌄</span>';
    trigger.classList.remove("signed-in");
    trigger.title = "Sign in";
    trigger.setAttribute("aria-label", "Sign in");
    return;
  }
  trigger.innerHTML = '<span class="account-entry-avatar">' + (user.displayName || user.email || "S").slice(0,1).toUpperCase() + '</span><span class="account-entry-copy"><b>' + (user.displayName || "My account").replace(/[&<>"]/g, "") + '</b><small>View profile · ' + (user.email || "").replace(/[&<>"]/g, "") + '</small></span><span class="account-entry-chevron">⌄</span>';
  trigger.classList.add("signed-in");
  trigger.title = user.email || "Account";
  trigger.setAttribute("aria-label", "Account: " + (user.email || "signed in"));
  if (user.photoURL) trigger.innerHTML = '<img src="' + user.photoURL.replace(/&/g,"&amp;").replace(/"/g,"&quot;") + '" alt="">';
}
if (configured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
      updateAccount(user);
      if (user && !user.emailVerified && user.providerData.some(p => p.providerId === "password")) {
        showMessage("Check your inbox for the SONORA verification email.");
      }
    });
  } catch (error) {
    configured = false;
    console.error("SONORA auth setup:", error);
  }
}
$("#auth-trigger").addEventListener("click", () => auth?.currentUser ? (openAuth(), showMessage("Signed in as " + auth.currentUser.email + ". Use sign out below."), $("#auth-submit").hidden = true, $("#google-auth").hidden = true, $("#auth-form").hidden = true, $("#auth-forgot").hidden = true, $("#auth-switch").hidden = true, $("#auth-signout").hidden = false, $("#profile-editor").hidden = false, $("#profile-display-name").value = auth.currentUser.displayName || "", $("#account-email-note").textContent = auth.currentUser.email || "", showAccountTab("profile")) : (resetDialog(), openAuth()));
function resetDialog() {
  $("#auth-submit").hidden = false; $("#google-auth").hidden = false; $("#auth-form").hidden = false;
  $("#auth-forgot").hidden = false; $("#auth-switch").hidden = false; $("#auth-signout").hidden = true; $("#profile-editor").hidden = true;
}
$("#auth-close").addEventListener("click", closeAuth);
modal.addEventListener("click", (e) => { if (e.target === modal) closeAuth(); });
$("#auth-switch-btn").addEventListener("click", () => setMode(mode === "signin" ? "signup" : "signin"));
$("#google-auth").addEventListener("click", async () => {
  if (!configured) return showMessage("Firebase isn't configured yet. Follow the Firebase setup in the README.", true);
  try { await signInWithPopup(auth, new GoogleAuthProvider()); closeAuth(); showMessage(""); }
  catch (error) { showMessage(friendlyError(error), true); }
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured) return showMessage("Firebase isn't configured yet. Follow the Firebase setup in the README.", true);
  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  const button = $("#auth-submit");
  button.disabled = true; button.textContent = "Please wait…";
  try {
    if (mode === "signup") {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const name = $("#auth-name").value.trim();
      if (name) await updateProfile(credential.user, { displayName: name });
      await sendEmailVerification(credential.user);
      showMessage("Account created. Open the verification email we sent to " + email + ".");
    } else {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        showMessage("Please verify your email. We sent a fresh verification link to " + email + ".");
      } else {
        closeAuth();
        showMessage("Welcome back to SONORA.");
      }
    }
  } catch (error) { showMessage(friendlyError(error), true); }
  finally { button.disabled = false; button.textContent = mode === "signup" ? "Create account" : "Sign in"; }
});
$("#auth-forgot").addEventListener("click", async () => {
  if (!configured) return showMessage("Connect Firebase first to enable password reset.", true);
  const email = $("#auth-email").value.trim();
  if (!email) return showMessage("Enter your email address first.", true);
  try { await sendPasswordResetEmail(auth, email); showMessage("Password reset email sent. Check your inbox."); }
  catch (error) { showMessage(friendlyError(error), true); }
});
function showAccountTab(tab) { const settings = tab === "settings"; $("#account-profile-panel").hidden = settings; $("#account-settings-panel").hidden = !settings; $("#account-tab-profile").classList.toggle("active", !settings); $("#account-tab-settings").classList.toggle("active", settings); }
$("#account-tab-profile").addEventListener("click", () => showAccountTab("profile"));
$("#account-tab-settings").addEventListener("click", () => showAccountTab("settings"));
$("#setting-autoplay").checked = localStorage.getItem("sonora-autoplay-next") !== "false";
$("#setting-autoplay").addEventListener("change", e => localStorage.setItem("sonora-autoplay-next", String(e.target.checked)));
$("#profile-save").addEventListener("click", async () => { if (!auth?.currentUser) return; const name = $("#profile-display-name").value.trim(); if (!name) return showMessage("Enter a display name first.", true); try { await updateProfile(auth.currentUser, { displayName: name }); updateAccount(auth.currentUser); showMessage("Your profile has been updated."); } catch (error) { showMessage(friendlyError(error), true); } });
const signout = document.createElement("button");
signout.id = "auth-signout"; signout.className = "auth-submit"; signout.textContent = "Sign out"; signout.hidden = true;
signout.addEventListener("click", async () => { try { await signOut(auth); closeAuth(); resetDialog(); } catch (error) { showMessage(friendlyError(error), true); } });
$(".auth-dialog").append(signout);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeAuth(); });

// Keep the YouTube mini-player draggable without covering the whole app permanently.
const stage = $("#youtube-stage");
const dragHandle = $("#youtube-stage-drag");
const positionKey = "sonora-player-position-v1";
try {
  const saved = JSON.parse(localStorage.getItem(positionKey) || "null");
  if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
    stage.style.left = Math.max(8, Math.min(innerWidth - 180, saved.left)) + "px";
    stage.style.top = Math.max(8, Math.min(innerHeight - 130, saved.top)) + "px";
    stage.style.right = "auto"; stage.style.bottom = "auto";
  }
} catch {}
let drag = null;
dragHandle.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button")) return;
  const r = stage.getBoundingClientRect();
  drag = { x: e.clientX, y: e.clientY, left: r.left, top: r.top };
  dragHandle.setPointerCapture(e.pointerId);
});
dragHandle.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const left = Math.max(8, Math.min(innerWidth - stage.offsetWidth - 8, drag.left + e.clientX - drag.x));
  const top = Math.max(8, Math.min(innerHeight - stage.offsetHeight - 8, drag.top + e.clientY - drag.y));
  stage.style.left = left + "px"; stage.style.top = top + "px";
  stage.style.right = "auto"; stage.style.bottom = "auto";
});
function endDrag() {
  if (!drag) return;
  drag = null;
  const r = stage.getBoundingClientRect();
  try { localStorage.setItem(positionKey, JSON.stringify({left:r.left,top:r.top})); } catch {}
}
dragHandle.addEventListener("pointerup", endDrag);
dragHandle.addEventListener("pointercancel", endDrag);
window.addEventListener("resize", () => {
  if (stage.style.left) {
    const r = stage.getBoundingClientRect();
    stage.style.left = Math.max(8, Math.min(innerWidth - stage.offsetWidth - 8, r.left)) + "px";
    stage.style.top = Math.max(8, Math.min(innerHeight - stage.offsetHeight - 8, r.top)) + "px";
  }
});


window.addEventListener("sonora:library-change", (event) => {
  const user = auth?.currentUser;
  if (!user || !db || !cloudSyncReady) return;
  const data = event.detail || {};
  cloudWriteQueue = cloudWriteQueue.then(() => setDoc(doc(db,"sonoraLibraries",user.uid),{
    liked:Array.isArray(data.liked)?data.liked.slice(0,100):[],
    recent:Array.isArray(data.recent)?data.recent.slice(0,60):[],
    playlists:Array.isArray(data.playlists)?data.playlists:[],
    updatedAt:new Date().toISOString()
  },{merge:true})).catch(error => {
    console.error("SONORA cloud library save:",error);
    showMessage("Couldn't save your library to the cloud. Your local copy is safe.",true);
  });
});
