<template>
  <div class="black">
    <h1>Тональность: {{currentKey}}</h1>
    <p><strong>Для тестирования:</strong>
      <br>{{cadence}} <br>
      {{notesArray}} <br> </p>
    <p>Правильных ответов: {{totalCorrectAnswers}}</p>
    <p>Неправильных ответов: {{totalWrongAnswers}}</p>
    <p>Процент правильных ответов: {{calculateAnswersPercentage}}%</p>
    <p>Выбранная сложность: {{difficultyDescription[difficulty]}}</p>
    <div class="difficulty">
      <p>Выбрать сложность:</p>
      <p><strong>Easy</strong> - одна октава, тональность не меняется</p>
      <p><strong>Normal</strong> - три октавы, тональность не меняется</p>
      <p><strong>Hard</strong> - три октавы, тональность меняется на каждом вопросе</p>
      <input type="radio" v-model="difficulty" id="easy" value=0>
      <label for="easy">Easy</label>
      <input type="radio" v-model="difficulty" id="normal" value=1>
      <label for="normal">Normal</label>
      <input type="radio" v-model="difficulty" id="hard" value=2>
      <label for="hard">Hard</label>
      <button @click="setDifficulty">Начать</button>
    </div>
    <div class="checkbox">
      <p>Или</p>
      <p>Выбрать определенную тональность:</p>
      <input type="radio" v-model="mode" id="checkboxMajor" value="major" @change="switchRadioButton">
      <label for="checkboxMajor">Major</label>
      <input type="radio" v-model="mode" id="checkboxMinor" value="minor" @change="switchRadioButton">
      <label for="checkboxMinor">Minor</label>
      <select v-model="currentKey">
        <option v-for="key in keys" >{{key}}</option>
      </select>
      <button @click="setMode">Выбрать тональность</button>
    </div>
    <div class="volume">
      <p>Громкость: {{audioVolume}}</p>
      <input type="range" min="0" max="100" v-model="audioVolume">
    </div>
    <p>CorrectAnswer {{correctAnswer}}</p>
    <p>PreviousCorrectAnswer {{previousCorrectAnswer}}</p>
    <button @click="playNote()"> PLAY </button>
    <button @click="playCadence()"> SEQUENCE </button>
    <div class="answer">
      <button
          v-for="id in 8"
          class="answer__button"
          :id="id-1"
          ref="id"
          @click="checkAnswer"
      >
        {{id}}
      </button>
    </div>
  </div>
</template>

<script>
import {getFilenamesArray} from "@/components/controller";
export default {
  created() {
    this.getKeyAndMode('random', 'major', this.difficulty)
    this.keys = this.majorKeys
  },

  data() {
    return {
      difficultyDescription: ['Easy', 'Normal', 'Hard'],

      cadencePlayed: false,
      cadence: '',

      notesArray: [],
      correctAnswer: 0,
      previousCorrectAnswer: 0,
      answered: true,
      totalCorrectAnswers: 0,
      totalWrongAnswers: 0,
      currentNoteOctave: 1,

      keys: [],
      majorKeys: ['C','Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      minorKeys: ['Am', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'],
      currentKey: 'C',
      mode: 'major',
      difficulty: 1,
      audioVolume: 70
    }
  },

  methods: {
    switchRadioButton(event) {
      this.mode = event.target.value
      if(this.mode === 'major') {
        this.keys = this.majorKeys
        this.currentKey = 'C'
      } else {
        this.keys = this.minorKeys
        this.currentKey = 'Am'
      }
    },

    setMode(){
      let noteForDatabase = this.currentKey.toLowerCase().replace(/m/, '')
      switch (noteForDatabase) {
        case 'db':
          noteForDatabase = 'c#'; break;
        case 'eb':
          noteForDatabase = 'd#'; break;
        case 'gb':
          noteForDatabase = 'f#'; break;
        case 'ab':
          noteForDatabase = 'g#'; break;
        case 'bb':
          noteForDatabase = 'a#'; break;
      }
      this.getKeyAndMode(noteForDatabase, this.mode)
    },

    setDifficulty(){
      this.getKeyAndMode('random', 'major', +this.difficulty)
    },

    getKeyAndMode(keyName = 'random', modeName='major', difficulty = 2) {
      return getFilenamesArray(
          'http://localhost:4000/api/alenmethod',
          {
            "keyName": keyName,
            "modeName": modeName,
            "difficulty": difficulty
          }
      ).then(data => {
        this.cadence = data.cadence
        this.notesArray = data.notesArray
        this.currentKey = data.currentKey
        this.cadencePlayed = false
        this.answered = true
      })
    },

    playNote() {
      if (this.answered) {
        while (this.correctAnswer === this.previousCorrectAnswer) {
          if (this.difficulty) {
          this.correctAnswer = Math.floor(Math.random() * this.notesArray.length)
          } else {
            this.correctAnswer = Math.floor(Math.random()*7 + 7)
          }
          this.currentNoteOctave = Math.ceil(this.correctAnswer / 7)
        }
        this.answered = false
      }

      const notePath = require(`@/assets/audio/${this.notesArray[this.correctAnswer].fileName}`)
      const note = new Audio(notePath)
      note.volume = this.audioVolume/100

      this.cadencePlayed ? note.play() : this.playCadence()
    },

    playCadence() {
      const cadencePath = require(`@/assets/audio/sequence/${this.cadence}`)
      const cadence = new Audio(cadencePath)
      cadence.volume = this.audioVolume/140
      cadence.play()
      setTimeout(() => this.playNote(), 2800)
      this.cadencePlayed = true
    },

    checkAnswer(event) {
      const clickedNoteId = +event.target.id+(7*(this.currentNoteOctave-1))
      if(clickedNoteId === this.correctAnswer || [0, 7, 14, 21].includes(clickedNoteId) && !(this.correctAnswer % 7)) {
        this.totalCorrectAnswers++
        event.target.style.backgroundColor = 'mediumseagreen'
        this.playCorrectAnswer()
      }
      else {
        this.totalWrongAnswers++
        const buttonNotePath = require(`@/assets/audio/${this.notesArray[clickedNoteId].fileName}`)
        const answerNote = new Audio(buttonNotePath)
        event.target.style.backgroundColor = 'indianred'
        event.target.disabled = true
        answerNote.volume = this.audioVolume/100
        answerNote.play()
      }
    },

    playCorrectAnswer() {
      this.answered = true
      this.cadencePlayed = false
      this.previousCorrectAnswer = this.correctAnswer
      this.$refs.id.forEach(id => {
        id.style.backgroundColor = 'white'
        id.disabled = false
      })
      if (+this.difficulty === 2) {
        this.getKeyAndMode().then(()=> {
          this.playNote()
        })
      } else {
        this.playNote()
      }
    }
  },

  computed: {
    calculateAnswersPercentage() {
      return this.totalCorrectAnswers
          ? Math.ceil(this.totalCorrectAnswers
              / (this.totalCorrectAnswers + this.totalWrongAnswers)
              * 100)
          : 0
    }
  }
}
</script>

<style lang="scss" scoped>
.answer__button {
  transition: 0.5s ease;
}
.wrong {
  background-color: indianred;

}
.correct {
  background-color: mediumseagreen;
}
</style>