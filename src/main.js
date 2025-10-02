console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;

  try {
    let response = await fetch(`./${folder}/info.json`);
    let data = await response.json();

    songs = data.songs;

    // Render songs into UI
    let songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";
    for (const song of songs) {
      songUL.innerHTML += `
        <li>
          <img class="invert" width="34" src="./src/svg/music.svg" alt="">
          <div class="info">
              <div>${song.replace(".mp3", "")}</div>
              <div>Syed Jarrar</div>
          </div>
          <div class="playnow">
              <span>Play Now</span>
              <img class="invert" src="./src/svg/play.svg" alt="">
          </div>
        </li>`;
    }

    // Click event for each song
    Array.from(songUL.getElementsByTagName("li")).forEach((e, index) => {
      e.addEventListener("click", () => playMusic(songs[index]));
    });

    return songs;
  } catch (error) {
    console.error("Error loading songs:", error);
    return [];
  }
}

const playMusic = (track, pause = false) => {
  // Use relative paths for Vercel
  currentSong.src = `./${currFolder}/${track}`;
  if (!pause) {
    currentSong.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
    let playBtn = document.querySelector("#play");
    if (playBtn) playBtn.src = "./src/svg/pause.svg";
  } else {
    let playBtn = document.querySelector("#play");
    if (playBtn) playBtn.src = "./src/svg/play.svg";
  }
  document.querySelector(".songinfo").innerHTML = track.replace(".mp3", "");
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  let cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = "";

  // Albums you want to display
  const albums = ["ncs", "edm"];

  for (let folder of albums) {
    try {
      let metaResponse = await fetch(`./src/songs/${folder}/info.json`);
      let metadata = await metaResponse.json();

      cardContainer.innerHTML += `
        <div data-folder="src/songs/${folder}" class="card">
          <div class="play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000"
                    stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </div>
          <img src="./src/songs/${folder}/cover.jpg" alt="Album Cover"
               onerror="this.src='./src/svg/logo.svg'">
          <h2>${metadata.title}</h2>
          <p>${metadata.description}</p>
        </div>`;
    } catch (error) {
      console.error(`Error loading album ${folder}:`, error);
    }
  }

  // Click event → load songs from that album
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      let folder = item.currentTarget.dataset.folder;
      songs = await getSongs(folder);
      if (songs.length > 0) playMusic(songs[0]);
    });
  });
}

async function main() {
  let play = document.querySelector("#play");
  let previous = document.querySelector("#previous");
  let next = document.querySelector("#next");

  // Get the list of all the songs
  await getSongs("src/songs/ncs");
  if (songs && songs.length > 0) {
    playMusic(songs[0], true);
  }

  // Display all the albums on the page
  await displayAlbums();

  // Attach an event listener to play, next and previous
  if (play) {
    play.addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play();
        play.src = "./src/svg/pause.svg";
      } else {
        currentSong.pause();
        play.src = "./src/svg/play.svg";
      }
    });
  }

  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    if (currentSong.duration) {
      document.querySelector(
        ".songtime"
      ).innerHTML = `${secondsToMinutesSeconds(
        currentSong.currentTime
      )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
      let circle = document.querySelector(".circle");
      if (circle) {
        circle.style.left =
          (currentSong.currentTime / currentSong.duration) * 100 + "%";
      }
    }
  });

  // Add an event listener to seekbar
  let seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", (e) => {
      if (currentSong.duration) {
        let percent =
          (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        let circle = document.querySelector(".circle");
        if (circle) {
          circle.style.left = percent + "%";
        }
        currentSong.currentTime = (currentSong.duration * percent) / 100;
      }
    });
  }

  // Add an event listener for hamburger
  let hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      document.querySelector(".left").style.left = "0";
    });
  }

  // Add an event listener for close button
  let closeBtn = document.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.querySelector(".left").style.left = "-120%";
    });
  }

  // Next button
  if (next) {
    next.addEventListener("click", () => {
      if (songs && songs.length > 0) {
        currentSong.pause();
        console.log("Next clicked");
        let currentFile = currentSong.src.split("/").pop();
        let index = songs.findIndex((song) => song === currentFile);
        if (index >= 0 && index < songs.length - 1) {
          playMusic(songs[index + 1]);
        } else {
          playMusic(songs[0]); // Go to first song
        }
      }
    });
  }

  // Previous button
  if (previous) {
    previous.addEventListener("click", () => {
      if (songs && songs.length > 0) {
        currentSong.pause();
        console.log("Previous clicked");
        let currentFile = currentSong.src.split("/").pop();
        let index = songs.findIndex((song) => song === currentFile);
        if (index > 0) {
          playMusic(songs[index - 1]);
        } else {
          playMusic(songs[songs.length - 1]); // Go to last song
        }
      }
    });
  }

  // Volume control
  let volumeRange = document.querySelector(".range input");
  if (volumeRange) {
    volumeRange.addEventListener("change", (e) => {
      console.log("Setting volume to", e.target.value, "/ 100");
      currentSong.volume = parseInt(e.target.value) / 100;
      if (currentSong.volume > 0) {
        let volumeImg = document.querySelector(".volume>img");
        if (volumeImg) {
          volumeImg.src = volumeImg.src.replace("mute.svg", "volume.svg");
        }
      }
    });
  }

  // Mute button
  let volumeImg = document.querySelector(".volume>img");
  if (volumeImg) {
    volumeImg.addEventListener("click", (e) => {
      if (e.target.src.includes("volume.svg")) {
        e.target.src = e.target.src.replace("volume.svg", "mute.svg");
        currentSong.volume = 0;
        if (volumeRange) volumeRange.value = 0;
      } else {
        e.target.src = e.target.src.replace("mute.svg", "volume.svg");
        currentSong.volume = 0.1;
        if (volumeRange) volumeRange.value = 10;
      }
    });
  }
}

main();
