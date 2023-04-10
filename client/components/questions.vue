<template>
<div>
    <div v-for="(q, i) in questions" :key="i" :title="q.tooltip || ''" v-show="tempIdx === i">
        <div class="select-question" v-if="'select-dropdown' === q.type">
            <div>{{q.title || q.var || ''}}</div>
            <div>
                <label class="matter-radio" v-for="(o, ii) in (q.options || [])" :key="ii" @click="saveTempAnswer(o.id, i)">
                    <input type="radio" :value="o.id" :name="'group-' + i" :checked="tempAnswers[i] === o.id" :disabled="i !== tempIdx"/>
                    <span>{{o.title || o.id}}</span>
                </label>
            </div>
            <div v-if="q.description"><small>{{q.description}}</small></div>
        </div>
        <div class="text-question" v-else-if="'text' === q.type">
            <label class="matter-textfield-filled">
                <input :name="'text-' + i" placeholder=" " :value="tempAnswers[i] || ''" @input="saveTempAnswer($event.target.value, i)"/>
                <span>{{q.title || q.var || ''}}</span>
            </label>
            <div v-if="q.description"><small>{{q.description}}</small></div>
        </div>
        <div class="text-question" v-else-if="'text-multiline' === q.type">
            <label class="matter-textfield-filled">
                <textarea :name="'text-' + i" placeholder=" " :value="tempAnswers[i] || ''" @input="saveTempAnswer($event.target.value, i)"></textarea>
                <span>{{q.title || q.var || ''}}</span>
            </label>
            <div v-if="q.description"><small>{{q.description}}</small></div>
        </div>
        <div><button class="next-question matter-button-contained" @click="nextAnswer" :disabled="!canGoNext(i)">next</button></div>
    </div>
</div>
</template>
<script>
module.exports = {
    data: () => ({
        tempIdx: 0,
        tempAnswers: [],
    }),
    computed: {
        questions() {
            return this.$store.state.lane?.questions || [];
        },
        question_answers() {
            return this.$store.state.lane?.question_answers || [];
        },
    },
    methods: {
        saveTempAnswer(v, i) {
            while ((this.tempAnswers.length - 1) < i) {
                this.tempAnswers.push(null);
            }
            this.$set(this.tempAnswers, i, v);
        },
        canGoNext(i) {
            return !!this.tempAnswers[i];
        },
        nextAnswer() {
            const currentAnswer = this.tempAnswers[this.tempIdx];
            if (!currentAnswer) return;
            this.$store.dispatch('nextAnswer', {answer: currentAnswer, i: this.tempIdx});
            this.tempIdx++;
        },
        focusText() {
            if (this.questions[this.tempIdx] && 'text' === this.questions[this.tempIdx].type) {
                setTimeout(() => document.getElementsByName('text-' + this.tempIdx)[0].focus(), 50);
            }
        },
    },
    watch: {
        tempIdx () {
            this.focusText();
        },
    },
    mounted() {
        this.tempAnswers = [...(this.question_answers || [])];
        this.focusText();
    }
};
</script>