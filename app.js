// // app.js

// const socket = new WebSocket(
//   `ws://localhost:8080/start_web_socket?username=${myUsername}`,
// );

// socket.onmessage = (m) => {
//   const data = JSON.parse(m.data);

//   switch (data.event) {
//     case "update-users":
//       // refresh displayed user list
//       let userListHtml = "";
//       for (const username of data.usernames) {
//         userListHtml += `<div> ${username} </div>`;
//       }
//       document.getElementById("users").innerHTML = userListHtml;
//       break;

//     case "send-message":
//       // display new chat message
//       addMessage(data.username, data.message);
//       break;
//   }
// };

// function addMessage(username, message) {
//   // displays new message
//   document.getElementById(
//     "conversation",
//   ).innerHTML += `<b> ${username} </b>: ${message} <br/>`;
// }

// // on page load
// window.onload = () => {
//   // when the client hits the ENTER key
//   document.getElementById("data").addEventListener("keypress", (e) => {
//     if (e.key === "Enter") {
//       const inputElement = document.getElementById("data");
//       var message = inputElement.value;
//       inputElement.value = "";
//       socket.send(
//         JSON.stringify({
//           event: "send-message",
//           message: message,
//         }),
//       );
//     }
//   });
// };

const video = document.querySelector("video");
const button = document.querySelector("#start");
let mediaRecorder = null;

button.onclick = function () {
    this.disabled = true;

    const roomName = prompt("Please enter your room name") || "public";
    console.log(roomName);

    const socket = new WebSocket(`ws://localhost:8080/room?a=${roomName}`);


    socket.onmessage = (m) => {
        try {
            const data = JSON.parse(m.data);
            if (data.role === "admin") {
                invokeGetDisplayMedia(function (stream) {
                    video.srcObject = stream;

                    // send stream to server
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            socket.send(e.data);
                        }
                    }
                    mediaRecorder.start(1000);
                });
            }
        } catch (err) {
            const blob = new Blob([m.data], {type: "video/webm;codecs=vp8"});
            video.src = URL.createObjectURL(blob);
        }
    }

};

function invokeGetDisplayMedia(success) {
    const constraints = {
        video: true,
    };
    if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia(constraints).then(success);
    } else {
        navigator.getDisplayMedia(constraints).then(success);
    }
}
