<template>
<div v-html="processed_answer"></div>
</template>
<script>
module.exports = {
    computed: {
        processed_answer() {
            return this.$store.state.lane?.processed_answer || '';
        },
    },
};
</script>