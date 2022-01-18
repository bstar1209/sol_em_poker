// get the suit of card
let getSuit = (card) => {
  return card.substring(0, 1);
}

// get the rank of card
let getRank = (card) => {
  return card.substring(1) - 0;
}

// get the predominant suit
let getPredominantSuit = (cards) => {
  var suit_count = [0, 0, 0, 0];
  for (var i = 0; i < cards.length; i++) {
    var s = getSuit(cards[i]);

    switch (s) {
      case 'c':
        suit_count[0]++;
        break;
      case 's':
        suit_count[1]++;
        break;
      case 'h':
        suit_count[2]++;
        break;
      case 'd':
        suit_count[3]++;
        break;
    }
  }

  let max = suit_count[0]
  let maxIndex = 0
  for (let i = 1; i < suit_count.length; i++) {
    if (max < suit_count[i]) {
      max = suit_count[i]
      maxIndex = i
    }
  }

  return ['c', 's', 'h', 'd'][maxIndex];
}

let getWinner = (players, layedCards) => {
  players.forEach(elem => {
    elem.handed = elem.handed.concat(layedCards)
  })

  var tests = [
    "straight_flush",
    "four_of_a_kind",
    "full_house",
    "flush",
    "straight",
    "three_of_a_kind",
    "two_pair",
    "one_pair",
    "high_card"
  ];

  let winner

  for (let i = 0; i < tests.length; i++) {
    winner = winnerHelper(players, tests[i])
    if (winner) {
      console.log(tests[i])
      break;
    }
  }

  return winner;
}

let winnerHelper = (players, test) => {
  let best

  for (let i = 0; i < players.length; i++) {
    if (players[i].status == 'folded') {
      continue;
    }

    let a = executeTest(test, players[i]);
    
    if (!a.handed.pattern) { // fit the pattern
      continue;
    }

    if (!best) { // if best is empty
      best = a;
      continue;
    }

    // compare with best and a
    if (executeCompare(test, best.handed.cards, a.handed.cards) == -1) { // a is won
      best = a; 
    }
  }

  return best
}

let executeTest = (strType, player) => {
  let result

  switch (strType) {
    case "straight_flush":
      result = testStraightFlush(player.handed)
      break;
    case "four_of_a_kind":
      result = testFourOfAKind(player.handed)
      break;
    case "full_house":
      result = testFullHouse(player.handed)
      break;
    case "flush":
      result = testFlush(player.handed)
      break;
    case "straight":
      result = testStraight(player.handed)
      break;
    case "three_of_a_kind":
      result = testThreeOfAKind(player.handed)
      break;
    case "two_pair":
      result = testTwoPair(player.handed)
      break;
    case "one_pair":
      result = testPair(player.handed)
      break;
    case "high_card":
      result = testHighCard(player.handed)
      break;
  }

  return {
    username: player.username,
    handed: result,
  }
}

let executeCompare = (strType, best, cur) => {
  let result
  switch (strType) {
    case "straight_flush":
      result = compareStraight(best, cur)
      break;
    case "four_of_a_kind":
      result = compareFourOfAKind(best, cur)
      break;
    case "full_house":
      result = compareFullHouse(best, cur)
      break;
    case "flush":
      result = compareFlush(best, cur)
      break;
    case "straight":
      result = compareStraight(best, cur)
      break;
    case "three_of_a_kind":
      result = compareTreeOfAKind(best, cur)
      break;
    case "two_pair":
      result = compareTwoPair(best, cur)
      break;
    case "one_pair":
      result = comparePair(best, cur)
      break;
    case "high_card":
      result = compareHigh(best, cur)
      break;
  }

  return result;
}

let testStraightFlush = (cards) => {
  let mainSuit = getPredominantSuit(cards)
  var working_cards = new Array(7 + 1);

  for (var i = 0, j = 0; i < 7; i++) {
    if (getSuit(cards[i]) == mainSuit) {
      var rank = getRank(cards[i]);
      working_cards[j++] = rank;
      if (rank == 14) {
        working_cards[7] = 1; // ace == 1 too
      }
    }
  }

  working_cards = working_cards.filter(elem => elem > 0)
  working_cards.sort((p, n) => { return n - p }); // sort the array

  if (working_cards.length < 5) {
    return {
      pattern: false,
    }
  }

  for (let i = 0; i < working_cards.length; i++) {
    let deep = 0
    for (let j = 0; j < 4; j++) {
      let cur = working_cards[i + j]
      let next = working_cards[i + j + 1]
      if (cur && next && Math.abs(next - cur) == 1) {
        deep++;
      }
    }

    if (deep == 5 - 1) {
      return {
        pattern: true,
        cards: working_cards.splice(i, 5),
      }
    }
  }

  return {
    pattern: false,
  }
}

let compareStraight = (best, cur) => {
  if (best[0] > cur[0]) {
    return 1
  } else {
    return -1
  }
}

let testFourOfAKind = (cards) => {
  let ranks = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,);
  for (let i = 0; i < cards.length; i++) {
    ranks[getRank(cards[i])]++
  }

  let rank = ranks.findIndex(elem => elem == 4)
  if (rank == -1) { // no four cards
    return {
      pattern: false,
    }
  }

  return {
    pattern: true,
    cards: [
      'h' + rank,
      's' + rank,
      'c' + rank,
      'd' + rank,
    ],
  }
}

let compareFourOfAKind = (best, cur) => {
  if (getRank(best[0]) > getRank(cur[0])) {
    return 1
  } else {
    return -1
  }
}

let testFullHouse = (cards) => {
  let ranks = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,);
  for (let i = 0; i < cards.length; i++) {
    ranks[getRank(cards[i])]++
  }

  let pair3Rank = ranks.findIndex(elem => elem == 3)
  let pair2Rank = ranks.findIndex(elem => elem == 2)

  if (pair3Rank == -1 || pair2Rank == -1) { // no 3 pair or no 2 pair
    return {
      pattern: false,
    }
  }

  return {
    pattern: true,
    cards: (cards.filter(elem => getRank(elem) == pair3Rank).concat(cards.filter(elem => getRank(elem) == pair2Rank)))
  }
}

let compareFullHouse = (best, cur) => {
  if (getRank(best[0]) > getRank(cur[0])) { // compare 3 pair
    return 1
  } else if (getRank(best[0]) < getRank(cur[0])) { // compare 3 pair
    return -1
  } else {
    if (getRank(best[3]) > getRank(cur[3])) { // compare 2 pair
      return 1
    } else {
      return -1
    }
  }
}

let testFlush = (cards) => {
  let mainSuit = getPredominantSuit(cards)

  let working_cards = cards.filter(elem => getSuit(elem) == mainSuit);
  working_cards.sort(function (p, n) { return getRank(n) - getRank(p) }) // sort the array

  if (working_cards.length < 5) {
    return {
      pattern: false,
    }
  }

  return {
    pattern: true,
    cards: [
      working_cards[0],
      working_cards[1],
      working_cards[2],
      working_cards[3],
      working_cards[4],
    ],
  }
}

let compareFlush = (best, cur) => {
  for (let i = 0; i < 5; i++) {
    if (best[i] > cur[i]) {
      return 1
    } else if (best[i] < cur[i]) {
      return -1
    }
  }
  return 1
}

let testStraight = (cards) => {
  var working_cards = new Array(7 + 1);

  for (var i = 0, j = 0; i < 7; i++) {
    var rank = getRank(cards[i]);
    working_cards[j++] = rank;
    if (rank == 14) {
      working_cards[7] = 1; // ace == 1 too
    }
  }

  working_cards = working_cards.filter(elem => elem > 0)
  working_cards.sort((p, n) => { return n - p }); // sort the array

  working_cards = working_cards.filter(function (value, index, array) { // reduce the duplicated elem
    return array.indexOf(value) === index;
  });

  if (working_cards.length < 5) {
    return {
      pattern: false,
    }
  }

  for (let i = 0; i < working_cards.length; i++) {
    let deep = 0
    for (let j = 0; j < 4; j++) {
      let cur = working_cards[i + j]
      let next = working_cards[i + j + 1]
      if (cur && next && Math.abs(next - cur) == 1) {
        deep++;
      }
    }

    if (deep == 5 - 1) {
      return {
        pattern: true,
        cards: working_cards.splice(i, 5),
      }
    }
  }

  return {
    pattern: false,
  }
}

let testThreeOfAKind = (cards) => {
  let ranks = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,);
  for (let i = 0; i < cards.length; i++) {
    ranks[getRank(cards[i])]++
  }

  let pair3Rank = ranks.findIndex(elem => elem == 3)

  if (pair3Rank == -1) { // no 3 pair or no 2 pair
    return {
      pattern: false,
    }
  }

  return {
    pattern: true,
    cards: cards.filter(elem => getRank(elem) == pair3Rank)
  }
}

let compareTreeOfAKind = (best, cur) => {
  if (getRank(best[0]) > getRank(cur[0])) {
    return 1
  } else {
    return -1
  }
}

let testTwoPair = (cards) => {
  let ranks = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,);
  for (let i = 0; i < cards.length; i++) {
    ranks[getRank(cards[i])]++
  }

  if (ranks.filter(elem => elem == 2).length < 2) {
    return {
      pattern: false
    }
  }

  let working_cards = []
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (ranks[i] == 2) {
      working_cards = working_cards.concat(cards.filter(elem => getRank(elem) == i))
    }
  }
  working_cards = working_cards.concat(cards.filter(elem => getRank(elem) == ranks.lastIndexOf(1)))
  return {
    pattern: true,
    cards: working_cards,
  }
}

let compareTwoPair = (best, cur) => {
  if (getRank(best[0]) > getRank(cur[0])) { // compare first pair
    return 1
  } else if (getRank(best[0]) < getRank(cur[0])) { // compare first pair
    return -1
  } else {
    if (getRank(best[2]) > getRank(cur[2])) { // compare second pair
      return 1
    } else if (getRank(best[2]) < getRank(cur[2])) { // compare second pair
      return -1
    } else {
      if (getRank(best[4]) > getRank(cur[4])) { // compare last
        return 1
      } else {
        return -1
      }
    }
  }
}

let testPair = (cards) => {
  let ranks = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,);
  for (let i = 0; i < cards.length; i++) {
    ranks[getRank(cards[i])]++
  }

  if (ranks.filter(elem => elem == 2).length != 1) {
    return {
      pattern: false
    }
  }

  let working_cards = []
  working_cards = working_cards.concat(cards.filter(elem => getRank(elem) == ranks.findIndex(elem => elem == 2)))

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (ranks[i] == 1) {
      working_cards = working_cards.concat(cards.filter(elem => getRank(elem) == i))

      if (working_cards.length == 5) {
        break;
      }
    }
  }

  return {
    pattern: true,
    cards: working_cards,
  }
}

let comparePair = (best, cur) => {
  if (getRank(best[0]) > getRank(cur[0])) { // compare first pair
    return 1
  } else if (getRank(best[0]) < getRank(cur[0])) { // compare first pair
    return -1
  } else {
    for (let i = 2; i < 5; i++) {
      if (getRank(best[i]) > getRank(cur[i])) {
        return 1
      } else if (getRank(best[i]) < getRank(cur[i])) {
        return -1
      }
    }

    return 1
  }
}

let testHighCard = (cards) => {
  let working_cards = cards.sort(function (p, n) { return getRank(n) - getRank(p) }) // sort the array
  return {
    pattern: true,
    cards: working_cards.splice(0, 5)
  }
}

let compareHigh = (best, cur) => {
  for (let i = 0; i < 5; i++) {
    if (getRank(best[i]) > getRank(cur[i])) {
      return 1
    } else if (getRank(best[i]) < getRank(cur[i])) {
      return -1
    }
  }

  return 1
}

export default {
  getWinner,
  testStraightFlush,
  testFourOfAKind,
  testFullHouse,
  testFlush,
  testStraight,
  testThreeOfAKind,
  testTwoPair,
  testPair,
  testHighCard
}