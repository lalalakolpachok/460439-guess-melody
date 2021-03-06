import QuestionScreenView2 from './question-screen-view';
import changeView from '../../functions/change-view';
import showNextScreen from '../../functions/show-next-screen';
import getTimer from '../../functions/get-timer';
import Answer from '../../data/answer';
import {answers} from '../../data/game-data';

class QuestionScreen {
  constructor(questions) {
    this.questions = questions;
    this.view = new QuestionScreenView2(questions);
  }

  /**
   * Метод формирует и показывает экран с вопросом и запускает таймер
   * @param {Object} state - текущее состояние игры. Содержит данные о вопросах, ответах и оставшемся времени
   */

  init(state) {
    this.state = state;

    this.question = this.questions[this.state.currentQuestionIndex];
    this.view.init(this.question.type, this.question.options,
        this.question.audioLink, this.question.task, this.state.mistakes, this.state.time);
    changeView(this.view.element);

    this.startTime = this.state.time;
    this.timer = setInterval(this.onTimeChange.bind(this), 1000);

    this.view.onSendAnswerBtnClick = this.onSendAnswerBtnClick.bind(this);

    // Автоматически включаем песню на экранах с вопросами про исполнителя
    if (this.question.type === `artist`) {
      const playAudioBtn = document.querySelector(`.player-control`);
      playAudioBtn.click();
    }
  }

  onTimeChange() {
    if (this.state.time === 0) {
      clearInterval(this.timer);
      showNextScreen(this.state);
    }
    const newTime = getTimer(this.state.time).tick();
    this.state.time = newTime.value;
    this.view.updateTime(this.state.time);
  }

  /**
   * Метод определяет порядок действий при нажатии на кнопку отправки ответа:
   * - останавливается таймер
   * - записывается ответ
   * - сбрасывается форма ответа
   * @param evt
   */

  onSendAnswerBtnClick(evt) {
    let isAnswerCorrect;

    /** Собираем данные об ответе для разных типов вопросов */

    switch (this.question.type) {
      case `artist`:
        if (evt.target.className === `main-answer-preview`) {
          isAnswerCorrect = () => {
            return evt.target.alt === this.question.correctAnswer;
          };
        }
        break;

      case `genre`:
        const checkedCheckboxes = this.view.checkboxes.filter((checkbox) => {
          return checkbox.checked === true;
        });

        const playersAnswers = checkedCheckboxes.map((checkbox) => {
          return checkbox.dataset.genre;
        });

        isAnswerCorrect = () => {
          return playersAnswers.length === this.question.amountOfCorrectAnswers && playersAnswers.every((it) => {
            return it === this.question.target;
          });
        };
        break;
    }

    /** Рассчитываем потраченное на ответ время*/

    const endTime = this.state.time;
    const timeSpent = this.startTime - endTime;

    /** Формируем объект ответа на текущий вопрос */

    const answer = new Answer(isAnswerCorrect(), timeSpent);
    answers.push(answer);
    /** Обновляем состояние */

    this.state.currentQuestionIndex += 1;

    if (!isAnswerCorrect()) {
      this.state.mistakes += 1;
    }

    /** Сбрасываем значения */

    if (this.question.type === `genre`) {
      this.view.checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
        this.view.answerBtn.disabled = true;
      });
    }

    clearInterval(this.timer);

    /** Показываем следующий экран (вопрос или результат) */

    showNextScreen(this.state);
  }
}

export default QuestionScreen;
