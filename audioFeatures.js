(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('This extension must be run unsandboxed');
  }

  class AudioFeatures {
    constructor() {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = null;
      this.microphoneStream = null;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.startMicrophone();
    }

    getInfo() {
      return {
        id: 'audioFeatures',
        name: 'Audio Features',
        blocks: [
          {
            opcode: 'getVolume',
            blockType: Scratch.BlockType.REPORTER,
            text: 'current volume',
          },
          {
            opcode: 'getPitch',
            blockType: Scratch.BlockType.REPORTER,
            text: 'current pitch',
          },
          {
            opcode: 'getTone',
            blockType: Scratch.BlockType.REPORTER,
            text: 'current tone',
          },
        ],
      };
    }

    async startMicrophone() {
      try {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.microphone = this.audioContext.createMediaStreamSource(this.microphoneStream);
        this.microphone.connect(this.analyser);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }

    getVolume() {
      if (!this.microphone) return 0;

      this.analyser.getByteTimeDomainData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const value = this.dataArray[i] / 128 - 1;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);
      return Math.round(rms * 100);
    }

    getPitch() {
      if (!this.microphone) return 0;

      this.analyser.getByteFrequencyData(this.dataArray);
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        if (this.dataArray[i] > maxValue) {
          maxValue = this.dataArray[i];
          maxIndex = i;
        }
      }
      const nyquist = this.audioContext.sampleRate / 2;
      const frequency = (maxIndex / this.dataArray.length) * nyquist;
      return Math.round(frequency);
    }

    getTone() {
      const pitch = this.getPitch();
      if (pitch < 261.63) return 'Low';
      if (pitch < 523.25) return 'Medium';
      return 'High';
    }
  }

  Scratch.extensions.register(new AudioFeatures());
})(Scratch);
