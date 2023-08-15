import Questions from '../components/questions.vue';
import Vuex from 'vuex';
import Vue from 'vue';

Vue.prototype.$store = new Vuex.Store({
    state: {
        lane: {
            questions: [
                {
                    id: 'q1',
                    type: 'select-dropdown',
                    title: 'First question',
                    options: [
                        {
                            id: 'o1',
                            title: 'Option 1',
                        },
                    ],
                },
            ],
            question_answers: [],
        },
    },
});

export default {
    component: Questions,
};

export const QuestionsStory = {
};
