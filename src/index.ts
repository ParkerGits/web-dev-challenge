import { z } from 'zod';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>().basePath('/api/v1');

app.get('/questions/:id', async (c) => {
	const id = c.req.param('id');
	const parseResult = await z.coerce.number().safeParseAsync(id);
	if (!parseResult.success) {
		return c.json({ error: parseResult.error });
	}

	const questionNumber = parseResult.data;
	const result = await promptAi(c.env, questionNumber);

	return c.json(result);
});

async function promptAi(env: Env, questionNumber: number) {
	const messages = getPromptMessages(questionNumber);
	let tryCount = 0;
	while (tryCount < 5) {
		try {
			const { response } = (await env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
				messages,
				temperature: 1.4,
				seed: Date.now() % 1000000,
			})) as {
				response: string;
			};

			const formattedResponse = response.replaceAll('```', '');

			const responseParseResult = await z
				.object({
					question: z.string(),
					options: z.array(z.string()).length(4),
				})
				.parseAsync(JSON.parse(formattedResponse));
			return responseParseResult;
		} catch (e) {
			tryCount++;
			if (tryCount >= 5) {
				throw new Error(`error prompting ai: ${e}`);
			}
		}
	}
}

function getPromptMessages(questionNumber: number) {
	return [
		{
			role: 'system',
			content:
				'You are administering a multiple-choice quiz to help the user determine which Web Development framework they should use. The question and possible options you provide should resemble a personality test.',
		},
		{
			role: 'system',
			content: `Your questions and options should have the following tone: ${getQuestionNumberTone(questionNumber)}`,
		},
		{
			role: 'system',
			content:
				'Your response must contain some reference to Web Development frameworks like React, Angular, Vue, Nordcraft, SolidJS, Ruby on Rails, Elm, Astro, Ember.js, Preact, Vanilla JS, jQuery, Alpine.js',
		},
		{
			role: 'system',
			content:
				'Respond only with a single question and a set of 4 possible options. Your response must be valid JSON, with the schema {{ "question": string, "options": ["option1", "option2", "option3", "option4"] }}',
		},
		{
			role: 'user',
			content: `Provide a question regarding ${getFrameworkReason(questionNumber)} to help me determine which JavaScript framework I should use.`,
		},
	];
}

function getQuestionNumberTone(questionNumber: number) {
	return literaryToneWords[questionNumber % literaryToneWords.length];
}

function getFrameworkReason(questionNumber: number) {
	return frameworkReasons[questionNumber % frameworkReasons.length];
}

const literaryToneWords = [
	'Sarcasm',
	'Irony',
	'Humorous',
	'Formal',
	'Informal',
	'Pessimistic',
	'Optimistic',
	'Cynical',
	'Nostalgic',
	'Sentimental',
	'Melancholic',
	'Somber',
	'Lighthearted',
	'Playful',
	'Mocking',
	'Serious',
	'Mournful',
	'Joyful',
	'Dramatic',
	'Sardonic',
	'Angry',
	'Reflective',
	'Passionate',
	'Detached',
	'Reverent',
	'Bitter',
	'Objective',
	'Enthusiastic',
	'Apathetic',
	'Earnest',
	'Whimsical',
	'Tense',
	'Compassionate',
	'Optimistic',
	'Despondent',
	'Satirical',
	'Affectionate',
	'Respectful',
	'Critical',
	'Condescending',
	'Playful',
	'Thoughtful',
	'Detached',
	'Pompous',
	'Wry',
	'Sardonic',
	'Inspirational',
	'Philosophical',
	'Aggressive',
	'Detached',
];

const frameworkReasons = [
	'faster development time',
	'built-in security features',
	'scalability for larger projects',
	'easy integration with databases',
	'well-documented and supported',
	'cross-platform compatibility',
	'code reusability',
	'efficient routing system',
	'predefined components for UI',
	'large community and resources',
	'better project structure and organization',
	'pre-configured development environment',
	'improved testing capabilities',
	'better maintainability',
	'rich ecosystem of plugins and extensions',
	'responsive design support',
	'sEO-friendly features',
	'optimized performance',
	'standardized coding practices',
	'support for RESTful APIs',
];

export default app;
