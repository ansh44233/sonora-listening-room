const audio = document.querySelector("#audio");
const $ = (selector) => document.querySelector(selector);

// Keep the player state in one place so the list and controls stay in sync.
const state = {
  tracks: [],
  current: -1,
  liked: new Set(JSON.parse(localStorage.getItem("sonora-liked") || "[]")),
  shuffle: false,
  repeat: false
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function render() {
  $("#track-list").innerHTML = state.tracks.length
    ? state.tracks.map((track, index) => `
      <div class="track-row ${index === state.current ? "playing" : ""}" data-track="${index}">
        <span class="number">${String(index + 1).padStart(2, "0")}</span>
        <div class="track-info"><img src="${track.artworkUrl100 || ""}" alt="" loading="lazy"><div><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></div></div>
        <span class="track-album">${escapeHTML(track.collectionName || "Single")}</span>
        <span class="track-duration">${formatTime((track.trackTimeMillis || 30000) / 1000)}</span>
        <button class="row-like ${state.liked.has(track.trackId) ? "liked" : ""}" data-like="${track.trackId}" aria-label="Like track">${state.liked.has(track.trackId) ? "♥" : "♡"}</button>
      </div>`).join("")
    : '<div class="empty-note">No tracks found. Try another search.</div>';

  $("#result-count").textContent = `${state.tracks.length} TRACKS FOUND`;
  const current = state.tracks[state.current];
  const upcoming = state.tracks.filter((_, index) => index !== state.current).slice(0, 4);
  $("#queue-count").textContent = `${String(upcoming.length).padStart(2, "0")} TRACKS`;
  $("#queue-list").innerHTML = upcoming.map((track) => `
    <div class="queue-item" data-track="${state.tracks.indexOf(track)}">
      <img src="${track.artworkUrl100 || ""}" alt="">
      <div><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></div>
      <button aria-label="Play track">▶</button>
    </div>`).join("") || '<div class="empty-note">Your queue is taking a breath.</div>';

  const saved = state.tracks.filter(track => state.liked.has(track.trackId)).slice(0, 6);
  $("#library-list").innerHTML = saved.map(track => `
    <div class="library-item"><img src="${track.artworkUrl100 || ""}" alt=""><div><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></div></div>`).join("") || '<div class="empty-note">Like a track and it will find a home here.</div>';

  if (current) {
    $("#player-title").textContent = current.trackName;
    $("#player-artist").textContent = current.artistName;
    $("#feature-title").textContent = current.trackName;
    $("#feature-artist").textContent = current.artistName;
    $("#feature-cover").innerHTML = `<img src="${current.artworkUrl100?.replace("100x100", "600x600") || current.artworkUrl100}" alt="">`;
    $("#player-cover").innerHTML = `<img src="${current.artworkUrl100 || ""}" alt="">`;
    $("#duration").textContent = formatTime((current.trackTimeMillis || 30000) / 1000);
    $("#open-apple").onclick = () => window.open(current.trackViewUrl, "_blank", "noopener,noreferrer");
    $("#feature-like").classList.toggle("liked", state.liked.has(current.trackId));
    $("#player-like").classList.toggle("liked", state.liked.has(current.trackId));
  }
}

async function searchMusic(term, heading = "Search results") {
  if (!term.trim()) return;
  $("#track-heading").textContent = heading;
  $("#track-list").innerHTML = '<div class="loading-state"><span class="loader"></span> Looking through the catalogue...</div>';
  try {
    const url = new URL("https://itunes.apple.com/search");
    url.search = new URLSearchParams({ term, media: "music", entity: "song", limit: "18" });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Catalogue request failed");
    const data = await response.json();
    // Only show catalogue entries that actually have a playable preview URL.
    state.tracks = data.results.filter(track => track.previewUrl);
    state.current = -1;
    render();
    if (!state.tracks.length) showToast("No preview tracks found for that search.");
  } catch {
    $("#track-list").innerHTML = '<div class="empty-note">The music catalogue could not be reached. Check your connection and try again.</div>';
    showToast("Could not load music right now.");
  }
}

function selectTrack(index) {
  const track = state.tracks[index];
  if (!track) return;
  state.current = index;
  audio.src = track.previewUrl;
  audio.volume = Number($("#volume").value);
  render();
  audio.play().then(updatePlayButton).catch(() => showToast("Press play to start the preview."));
}

function updatePlayButton() {
  $("#play-btn").textContent = audio.paused ? "▶" : "Ⅱ";
  $("#play-btn").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
}

function nextTrack(direction = 1) {
  if (!state.tracks.length) return;
  let index = state.current + direction;
  if (state.shuffle && state.tracks.length > 1) {
    do { index = Math.floor(Math.random() * state.tracks.length); } while (index === state.current);
  }
  if (index < 0) index = state.tracks.length - 1;
  if (index >= state.tracks.length) index = 0;
  selectTrack(index);
}

function toggleLike(trackId) {
  const id = Number(trackId);
  state.liked.has(id) ? state.liked.delete(id) : state.liked.add(id);
  localStorage.setItem("sonora-liked", JSON.stringify([...state.liked]));
  render();
}

document.addEventListener("click", (event) => {
  const like = event.target.closest("[data-like]");
  if (like) { event.stopPropagation(); toggleLike(like.dataset.like); return; }
  const track = event.target.closest("[data-track]");
  if (track) selectTrack(Number(track.dataset.track));

  const mood = event.target.closest("[data-mood]");
  if (mood) {
    const queries = { indie: "indie alternative", chill: "chill acoustic", pop: "pop hits", focus: "lofi focus" };
    searchMusic(queries[mood.dataset.mood], `${mood.dataset.mood} mood`);
  }

  const view = event.target.closest("[data-view]");
  if (view) {
    document.querySelectorAll(".rail-btn").forEach(button => button.classList.toggle("active", button === view));
    if (view.dataset.view === "search") $("#search-input").focus();
    if (view.dataset.view === "home") searchMusic("indie pop", "In your rotation");
    if (view.dataset.view === "liked") {
      state.tracks = state.tracks.filter(track => state.liked.has(track.trackId));
      state.current = -1; render(); $("#track-heading").textContent = "Your liked tracks";
    }
    if (view.dataset.view === "library") showToast("Your saved tracks are in the left panel.");
  }
});

$("#search-input").addEventListener("keydown", event => {
  if (event.key === "Enter") searchMusic(event.currentTarget.value, `Results for “${event.currentTarget.value}”`);
});
$("#play-btn").addEventListener("click", () => {
  if (!audio.src) return state.tracks.length ? selectTrack(0) : showToast("Choose a track first.");
  audio.paused ? audio.play() : audio.pause();
});
$("#next-btn").addEventListener("click", () => nextTrack(1));
$("#prev-btn").addEventListener("click", () => audio.currentTime > 3 ? audio.currentTime = 0 : nextTrack(-1));
$("#shuffle-btn").addEventListener("click", () => {
  state.shuffle = !state.shuffle;
  $("#shuffle-btn").classList.toggle("liked", state.shuffle);
  showToast(state.shuffle ? "Shuffle is on." : "Shuffle is off.");
});
$("#repeat-btn").addEventListener("click", () => {
  state.repeat = !state.repeat;
  audio.loop = state.repeat;
  $("#repeat-btn").classList.toggle("liked", state.repeat);
});
$("#volume").addEventListener("input", event => audio.volume = Number(event.target.value));
$("#progress").addEventListener("input", event => audio.currentTime = Number(event.target.value));
audio.addEventListener("timeupdate", () => {
  $("#progress").value = audio.currentTime;
  $("#current-time").textContent = formatTime(audio.currentTime);
});
audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);
audio.addEventListener("ended", () => { updatePlayButton(); if (!state.repeat) nextTrack(1); });
$("#play-featured").addEventListener("click", () => state.current >= 0 ? (audio.paused ? audio.play() : audio.pause()) : selectTrack(0));
$("#shuffle-featured").addEventListener("click", () => { state.shuffle = true; nextTrack(1); });
$("#feature-like").addEventListener("click", () => state.current >= 0 && toggleLike(state.tracks[state.current].trackId));
$("#player-like").addEventListener("click", () => state.current >= 0 && toggleLike(state.tracks[state.current].trackId));
$("#refresh-moods").addEventListener("click", () => searchMusic("new music indie pop", "A few more discoveries"));
$("#add-playlist").addEventListener("click", () => showToast("Playlist folders are coming soon."));
$("#sort-library").addEventListener("click", () => showToast("Showing your latest saved tracks."));
document.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(item => item.classList.toggle("selected", item === chip));
  if (chip.dataset.filter === "liked") {
    state.tracks = state.tracks.filter(track => state.liked.has(track.trackId));
    state.current = -1; render(); $("#track-heading").textContent = "Your liked tracks";
  } else searchMusic(chip.dataset.filter === "recent" ? "recent indie hits" : "indie pop", "In your rotation");
}));

searchMusic("indie pop", "In your rotation");
