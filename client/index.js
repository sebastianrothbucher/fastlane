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
        existLanes: [],
        landings: [],
        landing: null,
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
            const laneFull = (await fetch('/api/createLaneFromDef?typeName=' + encodeURIComponent(lane.typeName) + '&forUsers=' + encodeURIComponent(this.$store.state.user), {method: 'POST'}).then(res => res.json())).lane; 
            await Promise.all((laneFull.questions || []).filter(q => !!q.limited).map(async q => { // check limited resources (if we give optons here, give the intersection)
                const limitedOptions = await fetch('/api/limited/' + q.limited).then(res => res.json());
                const availableOptions = limitedOptions.options.filter(lo => (!q.options) || (!!q.options.find(o => o.id === lo.id)));
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
        async openLanesDialog() {
            this.existLanes = (await fetch('/api/userlanes').then(res => res.json())).lanes; 
            this.$refs.dlg.showModal();
        },
        async openExistLane(laneId) {
            const laneFull = (await fetch('/api/lane/' + encodeURIComponent(laneId)).then(res => res.json())).lane; 
            if ('q' === laneFull.phase) {
                await Promise.all((laneFull.questions || []).filter(q => !!q.limited).map(async q => { // check limited resources (if we give optons here, give the intersection)
                    const limitedOptions = await fetch('/api/limited/' + q.limited).then(res => res.json());
                    const availableOptions = limitedOptions.options.filter(lo => (!q.options) || (!!q.options.find(o => o.id === lo.id)));
                    q.options = availableOptions;
                }));
            }
            this.$store.state.lane = laneFull;
            this.$refs.dlg.close();
        },
        closeLanesDialog() {
            this.$refs.dlg.close();
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
        openLandingLink(link) {
            if (link.link) {
                window.open(link.link);
            } else if (link.laneId) { // existing lane
                this.landing = null;
                this.openExistLane(link.laneId)
            } else if (link.lane) { // start new
                this.landing = null;
                this.loadLane({typeName: link.lane});
            } // else nth
        },
        closeLaneOrLanding () {
            if (this.landing) {
                this.landing = null;
                return;
            }
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
        // check if we're logged in and redirect if not
        const meCallRes = await fetch('/api/me');
        if (401 === meCallRes.status) {
            location.href="/login.html";
            return;
        } else if ((meCallRes.status - (meCallRes.status % 100)) !== 200) {
            alert('Error ' + meCallRes.status);
            return;
        }
        // (now pull data for initial screen)
        try {
            this.$store.state.lanes = (await fetch('/api/defs').then(res => res.json())).lanes; // shortcut, I know ;-)
            this.landings = (await fetch('/api/userlandings').then(res => res.json())).landings;
        } catch (err) {
            alert(err.message || err);
        }
    },
});