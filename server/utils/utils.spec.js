const utils = require('./utils');

describe('utils', () => {
    describe('processAnswer', () => {
        
        it('renders files as embedded', async () => {
            const res = await utils.processAnswer({
                endpoint: {
                    format: 'file',
                },
                endpoint_answer: 'app/whatever:123',
            });
            expect(res).toMatch(/^<iframe.*app\/whatever:123/);
        });

        it('renders verbatim markdown answers', async () => {
            const res = await utils.processAnswer({
                endpoint: {
                    format: 'markdown',
                },
                processing: {
                    type: null, 
                },
                endpoint_answer: '## hey',
            });
            expect(res).toMatch(/<h2.*hey/);
        });
        it('renders verbatim HTML answers', async () => {
            const res = await utils.processAnswer({
                endpoint: {
                    format: 'html',
                },
                processing: {
                    type: 'none', 
                },
                endpoint_answer: '<h2>hey</h2>',
            });
            expect(res).toMatch(/<h2.*hey/);
        });
        it('renders verbatim other answers', async () => {
            const res = await utils.processAnswer({
                endpoint: {
                    format: 'any other',
                },
                processing: {
                    type: 'default', 
                },
                endpoint_answer: 'hey',
            });
            expect(res).toMatch(/<pre.*hey/);
        });

        it('applies markdown templates to answer', async () => {
            const res = await utils.processAnswer({
                questions: [
                    {
                        id: 'q1',
                    },
                ],
                question_answers: [
                    'answer1',
                ],
                endpoint: {
                    format: 'whatever',
                },
                processing: {
                    type: 'template',
                    templateFormat: 'markdown',
                    template: [
                        '## test',
                        '',
                        'Answer first question: %q1%',
                        // TODO: same for answers
                    ],
                },
                endpoint_answer: {
                    field: 'whatever',
                },
            });
            expect(res).toMatch(/test.*question: answer1/s);
        });
    });

    describe('workReservations', () => {

        const dao = {
            getLimitedUse: () => ([
                {id: 'opt1', count: 1},
                {id: 'opt2', count: 3},
            ]),
        };
        const repo = {
            getLimitedRes: () => ({
                'res1': [
                    {id: 'opt1', count: 2},
                    {id: 'opt2', count: 3},
                ],
            }),
        };
        const demoLane = {
            questions: [
                {id: 'q1', limited: 'nonexist'}, // (non-existing res),
                {id: 'q2', limited: 'res1'},
                {id: 'q3', limited: 'res1'},
                {id: 'q4', limited: 'res1'},
                {id: 'q5'}, // (not limited),
            ],
            question_answers: [
                'opt2',
                'opt99', // (non-existing opt),
                'opt2', // (overbooked),
                'opt1', // (works)
                'whatever',
            ],
        }

        it('warns of potential issues', async () => {
            const res = await utils.workReservations(demoLane, dao, repo);
            expect(res.errors).toBeDefined();
            expect(res.reservations?.length || 0).toBe(0);
            expect(res.errors.length).toBe(3);
            expect(res.errors[0]).toMatch(/No slots for/);
            expect(res.errors[1]).toMatch(/No option/);
            expect(res.errors[2]).toMatch(/more free capacity/);
        });
        it('reserves when all is clear', async () => {
            const res = await utils.workReservations({questions: demoLane.questions.slice(3), question_answers: demoLane.question_answers.slice(3)}, dao, repo);
            expect(res.errors?.length || 0).toBe(0);
            expect(res.reservations).toBeDefined();
            expect(res.reservations.length).toBe(1);
            expect(res.reservations[0].resId).toBe('res1');
            expect(res.reservations[0].resOptionId).toBe('opt1');
        });
    });
});