import {Application, Router} from "https://deno.land/x/oak/mod.ts";

const app = new Application();
const router = new Router();
const port = 8080;

interface RoomUser {
    room: string;
    socket: WebSocket;
}

const roomAdmin = new Map<string, RoomUser>();
const roomUsers = new Map<string, RoomUser[]>();

function newUser(room: string, socket: WebSocket): RoomUser {
    return {
        room: room,
        socket: socket,
    };
}

// send a message to all connected clients
function broadcast(room: string, message: string | ArrayBufferLike | Blob | ArrayBufferView) {
    const users = roomUsers.get(room);
    if (users == undefined) {
        return;
    }

    for (const user of users) {
        user.socket.send(message);
    }
}

router.get("/room", async (context) => {
    const socket = await context.upgrade();
    const room = context.request.url.searchParams.get("a") || "public";
    const hasRoom = roomAdmin.has(room);
    const user = newUser(room, socket);

    if (!hasRoom) {
        roomAdmin.set(room, user);
    } else {
        let users = roomUsers.get(room);
        if (users == undefined) {
            users = [];
        }
        users.push(user);
        roomUsers.set(room, users);
    }

    const role = hasRoom ? "user" : "admin";
    console.log(role);

    socket.onopen = () => {
        socket.send(
            JSON.stringify({
                event: "role",
                role: role,
            })
        );
    };

    socket.onclose = () => {
        if (hasRoom) {
            const users = roomUsers.get(room);
            if (users != undefined) {
                const index = users.indexOf(user);
                if (index > -1) {
                    users.splice(index, 1);
                }
                roomUsers.set(room, users);
            }
        } else {
            // 是 admin
            broadcast(room, "admin close share room");
            roomAdmin.delete(room);
            roomUsers.delete(room);
        }
    };

socket.onmessage = (m) => {
    broadcast(
        room,
        m.data
    );
};
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
    await context.send({
        root: `${Deno.cwd()}/`,
        index: "index.html",
    });
});

console.log("Listening at http://localhost:" + port);
await app.listen({port});
