import assert from 'assert';

export default function (app, options) {
  const agenda = app.agenda;
  assert(agenda, 'agenda not configured properly, check your app');
}