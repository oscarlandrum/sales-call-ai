require("dotenv").config();
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const { spawn } = require("child_process");

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

const deepgram = createClient(DEEPGRAM_API_KEY);

async function start() {
  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    interim_results: true,
    diarize: true,
    encoding: "linear16",
    sample_rate: 48000,
    channels: 2,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Deepgram connected — listening... speak now!");
    const mic = spawn("sox", ["-d", "-r", "48000", "-c", "2", "-b", "16", "-e", "signed-integer", "-t", "raw", "-"]);
    mic.stdout.on("data", (chunk) => {
      if (connection.getReadyState() === 1) { connection.send(chunk); }
    });
    mic.stderr.on("data", (data) => { console.error("SOX:", data.toString()); });
    setInterval(() => {
      if (connection.getReadyState() === 1) { connection.keepAlive(); }
    }, 5000);
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel?.alternatives[0]?.transcript;
    if (transcript && data.is_final) {
      const speaker = data.channel.alternatives[0].words[0]?.speaker ?? "?";
      console.log(`[Speaker ${speaker}]: ${transcript}`);
    }
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => { console.error("Deepgram error:", err); });
  connection.on(LiveTranscriptionEvents.Close, () => { console.log("Connection closed."); });
}

start();
