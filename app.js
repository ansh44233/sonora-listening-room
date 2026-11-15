const audio = document.querySelector("#audio");
const $ = (selector) => document.querySelector(selector);

const STORAGE = { liked: "sonora-liked-v2", recent: "sonora-recent-v2" };
const readStore = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
};

const state = {
  tracks: [],
  current: null,
  liked: readStore(STORAGE.liked),
  recent: readStore(STORAGE.recent),
  shuffle: false,
  repeat: false,
  view: "home",
  request: 0
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2400);
}

function persist() {
  localStorage.setItem(STORAGE.liked, JSON.stringify(state.liked));
  localStorage.setItem(STORAGE.recent, JSON.stringify(state.recent.slice(0, 30)));
}

function setMessage(message, kind = "") {
  $("#track-list").innerHTML = `<div class="empty-state ${kind}"><span>${kind === "error" ? "!" : "♫"}</span><b>${escapeHTML(message)}</b><small>${kind === "error" ? "Check your connection and try again." : "Try a search or choose a mood above."}</small></div>`;
  $("#result-count").textContent = "READY WHEN YOU ARE";
}

function currentTrack() {
  return state.current;
}

function renderTracks() {
  const current = currentTrack();
  $("#track-list").innerHTML = state.tracks.length
    ? state.tracks.map((track, index) => {
      const isCurrent = current && current.trackId === track.trackId;
      const isLiked = state.liked.some(item => item.trackId === track.trackId);
      return `<div class="track-row ${isCurrent ? "playing" : ""}" data-track="${index}" tabindex="0" role="button" aria-label="Play ${escapeHTML(track.trackName)}">
        <span class="number">${String(index + 1).padStart(2, "0")}</span>
        <div class="track-info"><img src="${track.artworkUrl100 || ""}" alt="" loading="lazy"><div><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></div></div>
        <span class="track-album">${escapeHTML(track.collectionName || "Single")}</span>
        <span class="track-duration">${isCurrent && Number.isFinite(audio.duration) ? formatTime(audio.duration) : "0:30"}</span>
        <button class="row-like ${isLiked ? "liked" : ""}" data-like="${track.trackId}" aria-label="${isLiked ? "Unlike" : "Like"} track">${isLiked ? "♥" : "♡"}</button>
      </div>`;
    }).join("")
    : '<div class="empty-state"><span>♫</span><b>No tracks in this view yet.</b><small>Search for an artist, song or album to get started.</small></div>';

  $("#result-count").textContent = `${state.tracks.length} TRACKS`;
  renderLibrary();
  renderQueue();
  updateCurrentUI();
}

function renderLibrary() {
  const saved = state.view === "liked" ? state.liked : state.recent;
  const target = $("#library-list");
  if (!target) return;
  target.innerHTML = saved.slice(0, 8).map(track => `
    <button class="library-item" data-library-track="${track.trackId}">
      <img src="${track.artworkUrl100 || ""}" alt="">
      <span><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></span>
    </button>`).join("") || '<div class="empty-note">Your listening history will live here.</div>';
}

function renderQueue() {
  const upcoming = state.tracks.filter(track => !state.current || track.trackId !== state.current.trackId).slice(0, 4);
  $("#queue-count").textContent = `${String(upcoming.length).padStart(2, "0")} TRACKS`;
  $("#queue-list").innerHTML = upcoming.map(track => `
    <button class="queue-item" data-queue-track="${track.trackId}">
      <img src="${track.artworkUrl100 || ""}" alt="">
      <span><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></span>
      <span aria-hidden="true">▶</span>
    </button>`).join("") || '<div class="empty-note">Search for music to build your queue.</div>';
}

function updateCurrentUI() {
  const track = currentTrack();
  if (!track) return;
  $("#player-title").textContent = track.trackName;
  $("#player-artist").textContent = track.artistName;
  $("#feature-title").textContent = track.trackName;
  $("#feature-artist").textContent = track.artistName;
  $("#feature-cover").innerHTML = `<img src="${track.artworkUrl100?.replace("100x100", "600x600") || track.artworkUrl100}" alt="${escapeHTML(track.trackName)} artwork">`;
  $("#player-cover").innerHTML = `<img src="${track.artworkUrl100 || ""}" alt="">`;
  const liked = state.liked.some(item => item.trackId === track.trackId);
  $("#feature-like").classList.toggle("liked", liked);
  $("#player-like").classList.toggle("liked", liked);
  $("#feature-like").textContent = liked ? "♥" : "♡";
  $("#player-like").textContent = liked ? "♥" : "♡";
  $("#open-apple").disabled = !track.trackViewUrl;
}

function updatePlayButton() {
  $("#play-btn").textContent = audio.paused ? "▶" : "Ⅱ";
  $("#play-btn").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
}

async function searchMusic(term, heading = "Search results") {
  const query = term.trim();
  if (!query) {
    toast("Type an artist, song or album first.");
    $("#search-input").focus();
    return;
  }

  const requestId = ++state.request;
  state.view = "search";
  $("#track-heading").textContent = heading;
  $("#search-input").value = query;
  $("#track-list").innerHTML = '<div class="loading-state"><span class="loader"></span> Finding your next track...</div>';
  $("#result-count").textContent = "SEARCHING";

  try {
    const url = new URL("https://itunes.apple.com/search");
    url.search = new URLSearchParams({ term: query, media: "music", entity: "song", limit: "24", country: "IN" });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Search request failed");
    const data = await response.json();
    if (requestId !== state.request) return;
    state.tracks = (data.results || []).filter(track => track.previewUrl && track.trackId);
    renderTracks();
    if (!state.tracks.length) setMessage("No playable previews found for that search.");
  } catch {
    if (requestId !== state.request) return;
    setMessage("We couldn't reach the music catalogue.", "error");
  }
}

function selectTrack(track) {
  if (!track?.previewUrl) return toast("This track has no preview available.");
  state.current = track;
  if (!state.recent.some(item => item.trackId === track.trackId)) {
    state.recent.unshift(track);
    state.recent = state.recent.slice(0, 30);
  } else {
    state.recent = [track, ...state.recent.filter(item => item.trackId !== track.trackId)];
  }
  persist();
  audio.src = track.previewUrl;
  audio.volume = Number($("#volume").value);
  audio.load();
  renderTracks();
  audio.play().then(updatePlayButton).catch(() => toast("Your browser blocked playback. Press play to try again."));
}

function playFromCurrentResults(index) {
  const track = state.tracks[index];
  if (track) selectTrack(track);
}

function nextTrack(direction = 1) {
  if (!state.tracks.length) return toast("Search for some music first.");
  let index = state.current ? state.tracks.findIndex(track => track.trackId === state.current.trackId) : -1;
  if (state.shuffle && state.tracks.length > 1) {
    const choices = state.tracks.map((_, i) => i).filter(i => i !== index);
    index = choices[Math.floor(Math.random() * choices.length)];
  } else {
    index += direction;
    if (index < 0) index = state.tracks.length - 1;
    if (index >= state.tracks.length) index = 0;
  }
  playFromCurrentResults(index);
}

function toggleLike(track) {
  if (!track) return;
  const exists = state.liked.some(item => item.trackId === track.trackId);
  state.liked = exists
    ? state.liked.filter(item => item.trackId !== track.trackId)
    : [track, ...state.liked];
  persist();
  renderTracks();
  toast(exists ? "Removed from your liked songs." : "Saved to your liked songs.");
}

function showLiked() {
  state.view = "liked";
  state.tracks = [...state.liked];
  state.current = currentTrack();
  $("#track-heading").textContent = "Your liked songs";
  renderTracks();
}

function showRecent() {
  state.view = "recent";
  state.tracks = [...state.recent];
  $("#track-heading").textContent = "Recently played";
  renderTracks();
}

document.addEventListener("click", event => {
  const likeButton = event.target.closest("[data-like]");
  if (likeButton) {
    event.stopPropagation();
    const track = state.tracks.find(item => item.trackId === Number(likeButton.dataset.like));
    toggleLike(track);
    return;
  }

  const row = event.target.closest("[data-track]");
  if (row) { playFromCurrentResults(Number(row.dataset.track)); return; }

  const libraryTrack = event.target.closest("[data-library-track]");
  if (libraryTrack) {
    const track = [...state.liked, ...state.recent].find(item => item.trackId === Number(libraryTrack.dataset.libraryTrack));
    if (track) {
      if (!state.tracks.some(item => item.trackId === track.trackId)) state.tracks.unshift(track);
      selectTrack(track);
    }
    return;
  }

  const queueTrack = event.target.closest("[data-queue-track]");
  if (queueTrack) {
    const track = state.tracks.find(item => item.trackId === Number(queueTrack.dataset.queueTrack));
    if (track) selectTrack(track);
    return;
  }

  const mood = event.target.closest("[data-mood]");
  if (mood) {
    const terms = { indie: "indie alternative", chill: "chill acoustic", pop: "pop hits", focus: "lofi beats" };
    searchMusic(terms[mood.dataset.mood], `${mood.dataset.mood} mood`);
    return;
  }

  const view = event.target.closest("[data-view]");
  if (view) {
    document.querySelectorAll(".rail-btn").forEach(button => button.classList.toggle("active", button === view));
    if (view.dataset.view === "search") $("#search-input").focus();
    if (view.dataset.view === "home") searchMusic("indie pop", "In your rotation");
    if (view.dataset.view === "liked") showLiked();
    if (view.dataset.view === "library") showRecent();
  }
});

document.addEventListener("keydown", event => {
  const row = event.target.closest(".track-row");
  if (row && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    playFromCurrentResults(Number(row.dataset.track));
  }
});

$("#search-input").addEventListener("keydown", event => {
  if (event.key === "Enter") searchMusic(event.currentTarget.value, `Results for “${event.currentTarget.value}”`);
});
$("#play-btn").addEventListener("click", () => {
  if (!audio.src) return state.tracks.length ? playFromCurrentResults(0) : toast("Search for a track first.");
  if (audio.paused) audio.play().catch(() => toast("Playback could not start.")); else audio.pause();
});
$("#next-btn").addEventListener("click", () => nextTrack(1));
$("#prev-btn").addEventListener("click", () => {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else nextTrack(-1);
});
$("#shuffle-btn").addEventListener("click", () => {
  state.shuffle = !state.shuffle;
  $("#shuffle-btn").classList.toggle("liked", state.shuffle);
  toast(state.shuffle ? "Shuffle is on." : "Shuffle is off.");
});
$("#repeat-btn").addEventListener("click", () => {
  state.repeat = !state.repeat;
  audio.loop = state.repeat;
  $("#repeat-btn").classList.toggle("liked", state.repeat);
  toast(state.repeat ? "Repeat is on." : "Repeat is off.");
});
$("#volume").addEventListener("input", event => audio.volume = Number(event.target.value));
$("#progress").addEventListener("input", event => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value);
});
audio.addEventListener("loadedmetadata", () => {
  $("#progress").max = Number.isFinite(audio.duration) ? audio.duration : 30;
  $("#duration").textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  $("#progress").value = audio.currentTime;
  $("#current-time").textContent = formatTime(audio.currentTime);
});
audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);
audio.addEventListener("ended", () => { updatePlayButton(); if (!state.repeat) nextTrack(1); });
audio.addEventListener("error", () => toast("This preview is unavailable. Try another track."));
$("#play-featured").addEventListener("click", () => {
  if (audio.src && state.current) {
    if (audio.paused) audio.play().catch(() => toast("Playback could not start."));
    else audio.pause();
  } else nextTrack(1);
});
$("#shuffle-featured").addEventListener("click", () => {
  state.shuffle = true;
  $("#shuffle-btn").classList.add("liked");
  nextTrack(1);
});
$("#feature-like").addEventListener("click", () => toggleLike(state.current));
$("#player-like").addEventListener("click", () => toggleLike(state.current));
$("#open-apple").addEventListener("click", () => {
  if (state.current?.trackViewUrl) window.open(state.current.trackViewUrl, "_blank", "noopener,noreferrer");
});
$("#refresh-moods").addEventListener("click", () => searchMusic("new indie pop", "More to discover"));
$("#add-playlist").addEventListener("click", () => toast("Playlist creation is not available yet."));
$("#sort-library").addEventListener("click", showRecent);
document.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(item => item.classList.toggle("selected", item === chip));
  if (chip.dataset.filter === "liked") showLiked();
  else if (chip.dataset.filter === "recent") showRecent();
  else searchMusic("indie pop", "In your rotation");
}));

$("#progress").max = 30;
renderLibrary();
searchMusic("indie pop", "In your rotation");
