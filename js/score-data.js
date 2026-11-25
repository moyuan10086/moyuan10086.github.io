(function (root) {
  'use strict';

  // Format: [pitch, beatStart, durationBeats, velocity?, flags?]
  // flags: 's' = staccato
  // Pedal marks: [beatStart, durationBeats]

  function arp3(bar, notes, vel) {
    // 3/4 waltz arpeggio: 6 eighth notes per bar
    var base = bar * 3;
    return notes.map(function (p, i) {
      return [p, base + i * 0.5, 0.5, vel || 0.62];
    });
  }

  function waltz(bar, bassNote, chord, vel) {
    var base = bar * 3;
    var out = [[bassNote, base, 1, vel || 0.68]];
    chord.forEach(function (p) {
      out.push([p, base + 1, 1, (vel || 0.68) * 0.82]);
      out.push([p, base + 2, 1, (vel || 0.68) * 0.76]);
    });
    return out;
  }

  function buildLaLaLand() {
    // Mia & Sebastian's Theme (A minor, 3/4, 16 bars)
    var treble = [
      // Bars 0-3: Opening yearning motif (A minor -> F -> Dm -> E7)
      ['A4', 0, 0.5, 0.78], ['C5', 0.5, 0.5, 0.8], ['E5', 1, 0.5, 0.85], ['F5', 1.5, 0.5, 0.88], ['E5', 2, 0.5, 0.82], ['C5', 2.5, 0.5, 0.76],
      ['D5', 3, 1.5, 0.86], ['C5', 4.5, 0.5, 0.8], ['B4', 5, 1, 0.78],
      ['A4', 6, 0.5, 0.78], ['C5', 6.5, 0.5, 0.82], ['E5', 7, 0.5, 0.86], ['F5', 7.5, 0.5, 0.9], ['E5', 8, 0.5, 0.84], ['C5', 8.5, 0.5, 0.78],
      ['B4', 9, 2, 0.84], ['E5', 11, 1, 0.78],

      // Bars 4-7: Second phrase lifting higher
      ['A4', 12, 0.5, 0.8], ['C5', 12.5, 0.5, 0.84], ['E5', 13, 0.5, 0.88], ['G5', 13.5, 0.5, 0.92], ['F5', 14, 0.5, 0.88], ['E5', 14.5, 0.5, 0.84],
      ['D5', 15, 1.5, 0.9], ['E5', 16.5, 0.5, 0.84], ['C5', 17, 1, 0.82],
      ['B4', 18, 0.5, 0.8], ['C5', 18.5, 0.5, 0.82], ['D5', 19, 0.5, 0.86], ['E5', 19.5, 0.5, 0.88], ['D5', 20, 0.5, 0.84], ['C5', 20.5, 0.5, 0.8],
      ['B4', 21, 2.5, 0.86], ['G#4', 23.5, 0.5, 0.76],

      // Bars 8-11: Waltzing bright climax (F -> G -> Em -> Am)
      ['A5', 24, 1, 0.94, 's'], ['G5', 25, 0.5, 0.88], ['F5', 25.5, 0.5, 0.86], ['E5', 26, 0.5, 0.88], ['F5', 26.5, 0.5, 0.9],
      ['G5', 27, 1.5, 0.94], ['F5', 28.5, 0.5, 0.86], ['E5', 29, 1, 0.88],
      ['D5', 30, 0.5, 0.86], ['E5', 30.5, 0.5, 0.88], ['F5', 31, 0.5, 0.92], ['A5', 31.5, 0.5, 0.95], ['G5', 32, 0.5, 0.9], ['E5', 32.5, 0.5, 0.86],
      ['E5', 33, 2, 0.9], ['C5', 35, 1, 0.82],

      // Bars 12-15: Tender resolution back to A minor
      ['F5', 36, 1, 0.88], ['E5', 37, 0.5, 0.84], ['D5', 37.5, 0.5, 0.82], ['C5', 38, 1, 0.8],
      ['D5', 39, 1.5, 0.84], ['C5', 40.5, 0.5, 0.78], ['B4', 41, 1, 0.76],
      ['C5', 42, 0.5, 0.76], ['E5', 42.5, 0.5, 0.8], ['A5', 43, 1, 0.84], ['E5', 44, 1, 0.76],
      ['A4', 45, 3, 0.82]
    ];

    var bass = [].concat(
      arp3(0, ['A2', 'E3', 'A3', 'C4', 'A3', 'E3'], 0.58),
      arp3(1, ['F2', 'C3', 'F3', 'A3', 'F3', 'C3'], 0.58),
      arp3(2, ['D2', 'A2', 'D3', 'F3', 'D3', 'A2'], 0.58),
      arp3(3, ['E2', 'B2', 'E3', 'G#3', 'E3', 'B2'], 0.58),
      arp3(4, ['A2', 'E3', 'A3', 'C4', 'A3', 'E3'], 0.62),
      arp3(5, ['F2', 'C3', 'F3', 'A3', 'F3', 'C3'], 0.62),
      arp3(6, ['D2', 'A2', 'D3', 'F3', 'D3', 'A2'], 0.62),
      arp3(7, ['E2', 'B2', 'E3', 'G#3', 'B3', 'E3'], 0.64),
      waltz(8, 'F2', ['C3', 'F3', 'A3'], 0.68),
      waltz(9, 'G2', ['D3', 'G3', 'B3'], 0.68),
      waltz(10, 'E2', ['B2', 'E3', 'G3'], 0.66),
      waltz(11, 'A2', ['E3', 'A3', 'C4'], 0.66),
      arp3(12, ['D2', 'A2', 'D3', 'F3', 'D3', 'A2'], 0.58),
      arp3(13, ['E2', 'B2', 'E3', 'G#3', 'E3', 'B2'], 0.56),
      arp3(14, ['A2', 'E3', 'A3', 'C4', 'E4', 'A3'], 0.54),
      [['A2', 45, 3, 0.62], ['E3', 45, 3, 0.52]]
    );

    var pedals = [];
    for (var b = 0; b < 16; b++) pedals.push([b * 3, 2.8]);

    return {
      id: 'lalaland',
      kicker: 'PIANO STUDY / 01—16',
      title: 'La La Land',
      subtitle: 'A little light between the notes.',
      audioUrl: 'https://musicapi.haitangw.net/music/kw.php?type=mp3&id=83304406&level=standard',
      audioOffset: 1.77,
      bpm: 113,
      timeSig: [3, 4],
      bars: 16,
      treble: treble,
      bass: bass,
      pedals: pedals
    };
  }

  function buildHisTheme() {
    // His Theme (Undertale - Toby Fox, Bb major, 3/4, 16 bars)
    var treble = [
      // Bars 0-3
      ['Bb4', 0, 1, 0.78], ['F5', 1, 1, 0.84], ['Eb5', 2, 1, 0.8],
      ['Bb4', 3, 1, 0.76], ['D5', 4, 1, 0.82], ['D5', 5, 1, 0.8],
      ['Eb5', 6, 1, 0.84], ['F5', 7, 1, 0.86], ['Bb4', 8, 1, 0.78],
      ['D5', 9, 2, 0.82], ['C5', 11, 1, 0.78],

      // Bars 4-7
      ['Bb4', 12, 1, 0.8], ['F5', 13, 1, 0.86], ['Eb5', 14, 1, 0.82],
      ['Bb4', 15, 1, 0.78], ['D5', 16, 1, 0.84], ['D5', 17, 1, 0.82],
      ['Eb5', 18, 1, 0.86], ['G5', 19, 1, 0.9], ['F5', 20, 1, 0.86],
      ['F5', 21, 3, 0.84],

      // Bars 8-11: Higher emotional octave lift
      ['Bb5', 24, 1, 0.88], ['F5', 25, 1, 0.86], ['Eb5', 26, 1, 0.84],
      ['Bb4', 27, 1, 0.8], ['D5', 28, 1, 0.86], ['D5', 29, 1, 0.84],
      ['Eb5', 30, 1, 0.86], ['F5', 31, 1, 0.9], ['G5', 32, 1, 0.92],
      ['F5', 33, 2, 0.88], ['Eb5', 35, 1, 0.82],

      // Bars 12-15: Gentle fading lullaby
      ['D5', 36, 1, 0.82], ['Eb5', 37, 1, 0.84], ['F5', 38, 1, 0.82],
      ['D5', 39, 1, 0.8], ['C5', 40, 1, 0.78], ['Bb4', 41, 1, 0.76],
      ['C5', 42, 1.5, 0.78], ['D5', 43.5, 0.5, 0.76], ['C5', 44, 1, 0.74],
      ['Bb4', 45, 3, 0.8]
    ];

    var bass = [].concat(
      arp3(0, ['Eb2', 'Bb2', 'Eb3', 'G3', 'Eb3', 'Bb2'], 0.56),
      arp3(1, ['F2', 'C3', 'F3', 'A3', 'F3', 'C3'], 0.56),
      arp3(2, ['G2', 'D3', 'G3', 'Bb3', 'G3', 'D3'], 0.56),
      arp3(3, ['D2', 'A2', 'D3', 'F3', 'D3', 'A2'], 0.54),
      arp3(4, ['Eb2', 'Bb2', 'Eb3', 'G3', 'Eb3', 'Bb2'], 0.58),
      arp3(5, ['F2', 'C3', 'F3', 'A3', 'F3', 'C3'], 0.58),
      arp3(6, ['G2', 'D3', 'G3', 'Bb3', 'G3', 'D3'], 0.58),
      arp3(7, ['Bb2', 'F3', 'Bb3', 'D4', 'Bb3', 'F3'], 0.56),
      arp3(8, ['Eb2', 'Bb2', 'Eb3', 'G3', 'Bb3', 'G3'], 0.62),
      arp3(9, ['F2', 'C3', 'F3', 'A3', 'C4', 'A3'], 0.62),
      arp3(10, ['G2', 'D3', 'G3', 'Bb3', 'D4', 'Bb3'], 0.62),
      arp3(11, ['D2', 'A2', 'D3', 'F3', 'A3', 'F3'], 0.58),
      arp3(12, ['Eb2', 'Bb2', 'Eb3', 'G3', 'Eb3', 'Bb2'], 0.56),
      arp3(13, ['F2', 'C3', 'F3', 'A3', 'F3', 'C3'], 0.54),
      arp3(14, ['F2', 'C3', 'F3', 'A3', 'C4', 'A3'], 0.5),
      [['Bb2', 45, 3, 0.58], ['F3', 45, 3, 0.5]]
    );

    var pedals = [];
    for (var b = 0; b < 16; b++) pedals.push([b * 3, 2.8]);

    return {
      id: 'histheme',
      kicker: 'UNDERTALE / 01—16',
      title: 'His Theme',
      subtitle: 'Memory carried in gentle arpeggios.',
      bpm: 96,
      timeSig: [3, 4],
      bars: 16,
      treble: treble,
      bass: bass,
      pedals: pedals
    };
  }

  function buildHanabi() {
    // Uchiage Hanabi (Eb major, 4/4, 12 bars - Piano motif & soaring chorus)
    function arp4(bar, notes, vel) {
      var base = bar * 4;
      return notes.map(function (p, i) {
        return [p, base + i * 0.5, 0.5, vel || 0.58];
      });
    }

    var treble = [
      // Bars 0-3: Sparkling firework piano intro
      ['Bb5', 0, 0.5, 0.82], ['G5', 0.5, 0.5, 0.78], ['Eb5', 1, 0.5, 0.76], ['Bb4', 1.5, 0.5, 0.72],
      ['Ab5', 2, 0.5, 0.82], ['F5', 2.5, 0.5, 0.78], ['D5', 3, 0.5, 0.76], ['Bb4', 3.5, 0.5, 0.72],
      ['G5', 4, 0.5, 0.82], ['Eb5', 4.5, 0.5, 0.78], ['C5', 5, 0.5, 0.76], ['G4', 5.5, 0.5, 0.72],
      ['F5', 6, 1, 0.82], ['G5', 7, 1, 0.84],

      ['Bb5', 8, 0.5, 0.84], ['G5', 8.5, 0.5, 0.8], ['Eb5', 9, 0.5, 0.78], ['Bb4', 9.5, 0.5, 0.74],
      ['C6', 10, 0.5, 0.88], ['Bb5', 10.5, 0.5, 0.84], ['G5', 11, 0.5, 0.82], ['F5', 11.5, 0.5, 0.8],
      ['Eb5', 12, 1.5, 0.84], ['F5', 13.5, 0.5, 0.8], ['G5', 14, 2, 0.86],

      // Bars 4-7: Lyrical melody
      ['G5', 16, 0.5, 0.86], ['Ab5', 16.5, 0.5, 0.88], ['Bb5', 17, 1, 0.92], ['G5', 18, 0.5, 0.86], ['F5', 18.5, 0.5, 0.84], ['Eb5', 19, 1, 0.86],
      ['F5', 20, 0.5, 0.84], ['G5', 20.5, 0.5, 0.86], ['Ab5', 21, 1, 0.9], ['G5', 22, 1, 0.86], ['F5', 23, 1, 0.82],
      ['Eb5', 24, 0.5, 0.84], ['F5', 24.5, 0.5, 0.86], ['G5', 25, 1, 0.9], ['Bb5', 26, 1, 0.92], ['Ab5', 27, 1, 0.88],
      ['G5', 28, 2, 0.88], ['F5', 30, 1, 0.84], ['Eb5', 31, 1, 0.82],

      // Bars 8-11: Climax shimmer & gentle close
      ['C6', 32, 1, 0.94], ['Bb5', 33, 0.5, 0.88], ['Ab5', 33.5, 0.5, 0.86], ['G5', 34, 1, 0.9], ['Eb5', 35, 1, 0.86],
      ['Ab5', 36, 1, 0.9], ['G5', 37, 0.5, 0.86], ['F5', 37.5, 0.5, 0.84], ['Eb5', 38, 1, 0.86], ['D5', 39, 1, 0.82],
      ['Eb5', 40, 0.5, 0.82], ['G5', 40.5, 0.5, 0.84], ['Bb5', 41, 1, 0.88], ['G5', 42, 1, 0.82], ['F5', 43, 1, 0.78],
      ['Eb5', 44, 4, 0.84]
    ];

    var bass = [].concat(
      arp4(0, ['Ab2', 'Eb3', 'Ab3', 'C4', 'Bb2', 'F3', 'Bb3', 'D4'], 0.56),
      arp4(1, ['C3', 'G3', 'C4', 'Eb4', 'G2', 'D3', 'G3', 'Bb3'], 0.56),
      arp4(2, ['Ab2', 'Eb3', 'Ab3', 'C4', 'Bb2', 'F3', 'Bb3', 'D4'], 0.58),
      arp4(3, ['Eb2', 'Bb2', 'Eb3', 'G3', 'Bb3', 'G3', 'Eb3', 'Bb2'], 0.58),
      arp4(4, ['Ab2', 'Eb3', 'Ab3', 'C4', 'Bb2', 'F3', 'Bb3', 'D4'], 0.62),
      arp4(5, ['G2', 'D3', 'G3', 'Bb3', 'C3', 'G3', 'C4', 'Eb4'], 0.62),
      arp4(6, ['F2', 'C3', 'F3', 'Ab3', 'Bb2', 'F3', 'Bb3', 'D4'], 0.62),
      arp4(7, ['Eb2', 'Bb2', 'Eb3', 'G3', 'Bb2', 'F3', 'Bb3', 'D4'], 0.6),
      arp4(8, ['Ab2', 'Eb3', 'Ab3', 'C4', 'Eb3', 'Bb3', 'Eb4', 'G3'], 0.64),
      arp4(9, ['F2', 'C3', 'F3', 'Ab3', 'Bb2', 'F3', 'Bb3', 'D4'], 0.62),
      arp4(10, ['Eb2', 'Bb2', 'Eb3', 'G3', 'Bb3', 'G3', 'Eb3', 'Bb2'], 0.56),
      [['Eb2', 44, 4, 0.62], ['Bb2', 44, 4, 0.52]]
    );

    var pedals = [];
    for (var b = 0; b < 12; b++) {
      pedals.push([b * 4, 1.9]);
      pedals.push([b * 4 + 2, 1.9]);
    }

    return {
      id: 'hanabi',
      kicker: 'SUMMER NIGHT / SOLO PIANO',
      title: '打上花火',
      subtitle: '纯钢琴版 · Fireworks reflected between treble and bass.',
      audioUrl: 'https://musicapi.haitangw.net/music/kw.php?type=mp3&id=274620435&level=standard',
      audioOffset: 0.03,
      bpm: 95,
      timeSig: [4, 4],
      bars: 12,
      treble: treble,
      bass: bass,
      pedals: pedals
    };
  }

  function buildBeethovenVirus() {
    // Pathétique Mov. 3 / Beethoven Virus motif (C minor, 2/4, 16 bars)
    var treble = [];
    var bass = [];

    function seq16(startBeat, pitches, vel) {
      pitches.forEach(function (p, i) {
        treble.push([p, startBeat + i * 0.25, 0.25, vel || 0.84, i % 2 === 0 ? 's' : '']);
      });
    }

    // Bars 0-3: Iconic driving C minor motif
    seq16(0, ['G4', 'C5', 'D5', 'Eb5', 'D5', 'C5', 'B4', 'C5'], 0.86);
    seq16(2, ['D5', 'Eb5', 'F5', 'D5', 'B4', 'G4', 'B4', 'D5'], 0.88);
    seq16(4, ['C5', 'Eb5', 'G5', 'F5', 'Eb5', 'D5', 'C5', 'B4'], 0.9);
    seq16(6, ['C5', 'G4', 'Eb5', 'C5', 'G5', 'Eb5', 'C5', 'G4'], 0.9);

    // Bars 4-7: Chromatic tension climb
    seq16(8, ['Ab5', 'G5', 'F5', 'Eb5', 'D5', 'C5', 'B4', 'C5'], 0.92);
    seq16(10, ['D5', 'F5', 'Ab5', 'G5', 'F5', 'Eb5', 'D5', 'B4'], 0.92);
    seq16(12, ['C5', 'D5', 'Eb5', 'F5', 'G5', 'Ab5', 'G5', 'F5'], 0.94);
    seq16(14, ['Eb5', 'D5', 'C5', 'B4', 'C5', 'D5', 'G4', 'B4'], 0.9);

    // Bars 8-11: High octave cascade
    seq16(16, ['G5', 'C6', 'B5', 'C6', 'G5', 'Eb5', 'D5', 'Eb5'], 0.95);
    seq16(18, ['F5', 'Ab5', 'G5', 'F5', 'Eb5', 'D5', 'C5', 'B4'], 0.92);
    seq16(20, ['C5', 'Eb5', 'G5', 'C6', 'Bb5', 'Ab5', 'G5', 'F5'], 0.95);
    seq16(22, ['Eb5', 'F5', 'G5', 'Eb5', 'D5', 'B4', 'G4', 'D5'], 0.92);

    // Bars 12-15: Finale virtuoso cadence
    seq16(24, ['C5', 'G4', 'C5', 'Eb5', 'G5', 'Eb5', 'C5', 'G4'], 0.92);
    seq16(26, ['F5', 'D5', 'B4', 'G4', 'B4', 'D5', 'F5', 'Ab5'], 0.94);
    seq16(28, ['G5', 'Eb5', 'C5', 'G4', 'D5', 'B4', 'G4', 'B4'], 0.94);
    treble.push(['C5', 30, 0.5, 0.96, 's'], ['Eb5', 30.5, 0.5, 0.96, 's'], ['C6', 31, 1, 0.98]);

    var bassChords = [
      ['C2', 'G2', 'C3', 'Eb3'], ['G2', 'D3', 'G3', 'B3'],
      ['C2', 'G2', 'C3', 'Eb3'], ['C2', 'G2', 'C3', 'Eb3'],
      ['F2', 'C3', 'F3', 'Ab3'], ['G2', 'D3', 'G3', 'B3'],
      ['C2', 'G2', 'C3', 'Eb3'], ['G2', 'D3', 'G3', 'B3'],
      ['C2', 'G2', 'C3', 'Eb3'], ['F2', 'C3', 'F3', 'Ab3'],
      ['Eb2', 'Bb2', 'Eb3', 'G3'], ['G2', 'D3', 'G3', 'B3'],
      ['C2', 'G2', 'C3', 'Eb3'], ['F2', 'C3', 'F3', 'Ab3'],
      ['G2', 'D3', 'G3', 'B3'], ['C2', 'G2', 'C3', 'C2']
    ];
    bassChords.forEach(function (ch, bar) {
      var b = bar * 2;
      ch.forEach(function (p, i) {
        bass.push([p, b + i * 0.5, 0.5, i === 0 ? 0.78 : 0.64, 's']);
      });
    });

    var pedals = [];
    for (var i = 0; i < 16; i += 2) pedals.push([i * 2, 1.8]);

    return {
      id: 'beethoven',
      kicker: 'PATHÉTIQUE / 01—16',
      title: 'Beethoven Virus',
      subtitle: 'Rapid sixteenth-note fireworks in C minor.',
      bpm: 132,
      timeSig: [2, 4],
      bars: 16,
      treble: treble,
      bass: bass,
      pedals: pedals
    };
  }

  var lala = buildLaLaLand();
  var lalaPiano = Object.assign({}, lala, {
    id: 'lalapiano',
    kicker: 'LA LA LAND / PIANO GROOVE',
    title: 'La La Land',
    subtitle: '钢琴律动版 · Light dancing across the staves.',
    audioUrl: 'https://musicapi.haitangw.net/music/kw.php?type=mp3&id=661543717&level=standard',
    audioOffset: 0.46,
    bpm: 130
  });
  var anotherDay = Object.assign({}, buildBeethovenVirus(), {
    id: 'anotherday',
    kicker: 'LA LA LAND / SOLO PIANO',
    title: 'Another Day Of Sun',
    subtitle: '纯钢琴版 · Sunlit keys on the highway to the stars.',
    audioUrl: 'https://musicapi.haitangw.net/music/kw.php?type=mp3&id=282827254&level=standard',
    audioOffset: 1.74,
    bpm: 127
  });

  root.MOYUAN_SCORES = {
    lalaland: lala,
    lalapiano: lalaPiano,
    anotherday: anotherDay,
    hanabi: buildHanabi()
  };
})(window);

