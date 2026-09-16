import { unoEngine, shuffleDeck } from '../src/gameEngine/uno/unoEngine';
import { UnoRules } from '../src/gameEngine/uno/unoRules';
import { UnoBotAI } from '../src/gameEngine/uno/unoBot';
import { buildStandardUnoDeck } from '../src/gameEngine/uno/unoConstants';
import { UnoCard } from '../src/gameEngine/uno/unoTypes';

describe('Uno Game Engine & Rules Suite', () => {
  test('Deck builder creates exactly 108 standard Uno cards', () => {
    const deck = buildStandardUnoDeck();
    expect(deck.length).toBe(108);

    const redCards = deck.filter((c) => c.color === 'red');
    const blueCards = deck.filter((c) => c.color === 'blue');
    const greenCards = deck.filter((c) => c.color === 'green');
    const yellowCards = deck.filter((c) => c.color === 'yellow');
    const wildCards = deck.filter((c) => c.color === 'wild');

    // 25 cards per color (1x '0', 2x '1-9', 2x 'skip', 2x 'reverse', 2x 'draw2')
    expect(redCards.length).toBe(25);
    expect(blueCards.length).toBe(25);
    expect(greenCards.length).toBe(25);
    expect(yellowCards.length).toBe(25);
    // 4x Wild + 4x Wild Draw 4 = 8 Wild cards
    expect(wildCards.length).toBe(8);
  });

  test('Card matching rules correctly evaluate legal plays', () => {
    const topCard: UnoCard = { id: 'c1', color: 'red', value: '5', scoreValue: 5 };

    // Same color
    expect(
      UnoRules.canPlayCard(topCard, 'red', { id: 'c2', color: 'red', value: '9', scoreValue: 9 }),
    ).toBe(true);

    // Same value
    expect(
      UnoRules.canPlayCard(topCard, 'red', { id: 'c3', color: 'blue', value: '5', scoreValue: 5 }),
    ).toBe(true);

    // Wild cards are always legal
    expect(
      UnoRules.canPlayCard(topCard, 'red', { id: 'c4', color: 'wild', value: 'wild', scoreValue: 50 }),
    ).toBe(true);
    expect(
      UnoRules.canPlayCard(topCard, 'red', { id: 'c5', color: 'wild', value: 'wild_draw4', scoreValue: 50 }),
    ).toBe(true);

    // Mismatched color and value is illegal
    expect(
      UnoRules.canPlayCard(topCard, 'red', { id: 'c6', color: 'green', value: '8', scoreValue: 8 }),
    ).toBe(false);
  });

  test('Uno match initializes correctly with 7 cards per player and valid top card', () => {
    const state = unoEngine.getInitialState({
      mode: 'computer',
      difficulty: 'medium',
      players: [
        { id: 'player1', name: 'Player 1', isBot: false },
        { id: 'bot1', name: 'RoboDex', isBot: true },
      ],
    });

    expect(state.players.length).toBe(2);
    expect(state.players[0].hand.length).toBe(7);
    expect(state.players[1].hand.length).toBe(7);
    expect(state.discardPile.length).toBe(1);
    expect(state.topCard).toBeDefined();
    expect(state.activeColor).toBeDefined();
    expect(state.roundOver).toBe(false);
  });

  test('Uno Bot AI evaluates decisions and picks valid card or draws', () => {
    const state = unoEngine.getInitialState({
      mode: 'computer',
      difficulty: 'medium',
      players: [
        { id: 'p1', name: 'P1', isBot: false },
        { id: 'bot1', name: 'RoboDex', isBot: true },
      ],
    });

    const decision = UnoBotAI.getBotDecision(state, 'bot1');
    expect(decision).toBeDefined();
    expect(decision.move).toBeDefined();
    expect(['play_card', 'draw_card', 'pass_turn', 'catch_uno']).toContain(decision.move.type);
  });

  test('Scoring calculates hand point values accurately', () => {
    const hand: UnoCard[] = [
      { id: '1', color: 'red', value: '3', scoreValue: 3 },
      { id: '2', color: 'blue', value: 'skip', scoreValue: 20 },
      { id: '3', color: 'wild', value: 'wild_draw4', scoreValue: 50 },
    ];
    expect(UnoRules.calculateHandScore(hand)).toBe(73);
  });
});
