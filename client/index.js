httpVueLoader.register(Vue, 'components/questions.vue');
httpVueLoader.register(Vue, 'components/answer.vue');
const vuexLocal = new VuexPersistence.VuexPersistence({
    key: 'fastlane',
    storage: window.localStorage,
});
const store = new Vuex.Store({
    state: {
        lanes: [],
        lane: null, // TODO: vue-router with ID
        user: 'sebastianrothbucher@googlemail.com', // TODO: api/me
    },
    actions,
    mutations,
    plugins: [/*vuexLocal.plugin*/],
});
const app = new Vue({
    el: '#app',
    store,
    data: () => ({
    }),
    computed: {
        lanes() {
            return this.$store.state.lanes;
        },
        lane() {
            return this.$store.state.lane;
        },
        phase() {
            return this.$store.state.lane?.phase;
        },
        questions() {
            return this.$store.state.lane?.questions || [];
        },
        question_answers() {
            return this.$store.state.lane?.question_answers || [];
        },
        processed_answer() {
            return this.$store.state.lane?.processed_answer || '';
        },
    },
    methods: {
        async loadLane(lane) {
            //const laneFull = await fetch('/lanes/' + lane.file).then(res => res.json()); 
            const laneFull = (await fetch('/api/createLaneFromDef?typeName=' + encodeURIComponent(lane.typeName) + '&forUsers=' + encodeURIComponent(this.$store.state.user), {method: 'POST'}).then(res => res.json())).lane; 
            await Promise.all((laneFull.questions || []).filter(q => !!q.limited).map(async q => { // check limited resources (if we give optons here, give the intersection)
                const limitedOptions = await fetch('/limited/' + q.limited).then(res => res.json());
                const availableOptions = limitedOptions.filter(lo => (!q.options) || (!!q.options.find(o => o.id === lo.id)));
                q.options = availableOptions;
            }));
            this.$store.state.lane = { // shortcut, I know ;-)
                ...laneFull,
                phase: 'q',
                question_answers: [],
                endpoint_answer: null,
                processed_answer: null,
            };
        },
        formatAnswer(q, answer) {
            if (!answer) {
                return '';
            }
            if (q?.options) {
                const mapped = q.options.find(o => o.id === answer);
                if (mapped) {
                    return mapped.title || mapped.id;
                }
            } // (else)
            return answer;
        },
        submitPreflight () {
            this.$store.dispatch('startProcess');
        },
        closeLane () {
            if (!this.$store.state.lane) {
                return;
            }
            if (!confirm('Close current request?')) {
                return;
            }
            this.$store.state.lane = null;
        }
    },
    async mounted() {
        try {
            //this.$store.state.lanes = await fetch('/lanes/index.json').then(res => res.json()); // shortcut, I know ;-)
            this.$store.state.lanes = (await fetch('/api/defs').then(res => res.json())).lanes; // shortcut, I know ;-)
        } catch (err) {
            alert(err.message || err);
        }
    },
});