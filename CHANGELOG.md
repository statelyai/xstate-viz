# XState Visualizer

## 0.8.6

### Patch Changes

- [#408](https://github.com/statelyai/xstate-viz/pull/408) [`1894954`](https://github.com/statelyai/xstate-viz/commit/1894954c478f34e3b91b431d5de56d633655fe74) Thanks [@mellson](https://github.com/mellson)! - Remove Sentry.

## 0.8.5

### Patch Changes

- [`60a35a2`](https://github.com/statelyai/xstate-viz/commit/60a35a2e3696a2434afc524180657e7b30e7aee8) Thanks [@mellson](https://github.com/mellson)! - Screenshots now have a better quality and are cropped to the machine.

## 0.8.2

### Patch Changes

- [#387](https://github.com/statelyai/xstate-viz/pull/387) [`77b2a13`](https://github.com/statelyai/xstate-viz/commit/77b2a13a76da0dbd9b2c7003c1872daca90c5760) Thanks [@zgotsch](https://github.com/zgotsch)! - Add some additional heuristics to avoid layout failures

## 0.8.1

### Patch Changes

- [#382](https://github.com/statelyai/xstate-viz/pull/382) [`a9019ed`](https://github.com/statelyai/xstate-viz/commit/a9019ed9ebdb5e962f96fe189b258f74e21eceef) Thanks [@mellson](https://github.com/mellson)! - The editor will now prefer imports from xstate core.

## 0.8.0

### Minor Changes

- [#377](https://github.com/statelyai/xstate-viz/pull/377) [`9b731ba`](https://github.com/statelyai/xstate-viz/commit/9b731baf0acc3e62343cc6cca0a7e9c4ffee0e2c) Thanks [@farskid](https://github.com/farskid)! - Support `confirm`, `prompt` and `window.*` in the visualizer

## 0.7.1

### Patch Changes

- [#373](https://github.com/statelyai/xstate-viz/pull/373) [`ecf0d23`](https://github.com/statelyai/xstate-viz/commit/ecf0d2384a5a05955eff5b7eea334d3f0ee887e6) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Updated API to point to projects rather than systems

## 0.7.0

### Minor Changes

- [#293](https://github.com/statelyai/xstate-viz/pull/293) [`67e24ae`](https://github.com/statelyai/xstate-viz/commit/67e24ae76aa253855c6bd866472f45c77be75367) Thanks [@jacksteamdev](https://github.com/jacksteamdev)! - You can now inspect via WebSocket. To do that you can add the WebSocket server url as a query parameter, for example `https://stately.ai/viz?inspect&server=ws://localhost:3000`

### Patch Changes

- [#343](https://github.com/statelyai/xstate-viz/pull/343) [`632f950`](https://github.com/statelyai/xstate-viz/commit/632f950c6d0d1989a263d2cb0f5cf0483950e8f2) Thanks [@Andarist](https://github.com/Andarist)! - Fixed panning/dragging interations (the ones that include pressing pointer down) in FireFox.

## 0.6.0

### Minor Changes

- [#338](https://github.com/statelyai/xstate-viz/pull/338) [`196e44d`](https://github.com/statelyai/xstate-viz/commit/196e44d296a845cdd0f6dfa230fdad3089a77d21) Thanks [@riccardo-forina](https://github.com/riccardo-forina)! - You can now visualize descriptions added directly to state nodes and transitions

### Patch Changes

- [#336](https://github.com/statelyai/xstate-viz/pull/336) [`225757d`](https://github.com/statelyai/xstate-viz/commit/225757de7c9d65397a2d14c5397a1432373a7266) Thanks [@kmannislands](https://github.com/kmannislands)! - Remove unecessary feature policy claims from generated embed iframes

## 0.5.1

### Patch Changes

- [#332](https://github.com/statelyai/xstate-viz/pull/332) [`9f93d67`](https://github.com/statelyai/xstate-viz/commit/9f93d67972aac00236333829ab55163ba65e2290) Thanks [@Andarist](https://github.com/Andarist)! - Fixed the app crashing when processing invalid actions - like when using a guard accidentally in a place of an action.

* [#334](https://github.com/statelyai/xstate-viz/pull/334) [`fecdc01`](https://github.com/statelyai/xstate-viz/commit/fecdc019b54c326b81afbf3c14d494d7a92351f5) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Self-transitions on the machine will no longer cause graph layout to fail:

  ```js
  import { createMachine } from 'xstate';

  const machine = createMachine({
    on: {
      // These will now display as expected
      LOAD: {},
      UPDATE: {},
    },
    states: {
      something: {},
    },
  });
  ```

## 0.5.0

### Minor Changes

- [#269](https://github.com/statelyai/xstate-viz/pull/269) [`0f8e205`](https://github.com/statelyai/xstate-viz/commit/0f8e205fd2652df6d07dff53eea18588d7b3e2d4) Thanks [@Andarist](https://github.com/Andarist)! - A possibility to start panning the canvas by pressing the middle button of a mouse has been added.

* [#237](https://github.com/statelyai/xstate-viz/pull/237) [`7599a26`](https://github.com/statelyai/xstate-viz/commit/7599a26e7482a0f8895e7821d223b6fcdde99c79) Thanks [@rthor](https://github.com/rthor), [@Andarist](https://github.com/Andarist)! - Added more keyboard interactions to the canvas:

  - arrows (<kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd><kbd>←</kbd>) can be used to move the canvas around (with <kbd>Shift</kbd> the step move is increased)
  - <kbd>+</kbd>/<kbd>-</kbd> can be used to zoom in/out
  - <kbd>Shift</kbd> + <kbd>1</kbd> can be used to fit the machine on the canvas

- [#315](https://github.com/statelyai/xstate-viz/pull/315) [`f98ce3f`](https://github.com/statelyai/xstate-viz/commit/f98ce3f97b58b499ceb88c5bdd15899b59eb12a7) Thanks [@farskid](https://github.com/farskid)! - Tweak controls options in embed mode

  - RESET and Fit To View are now available in all embed modes with `controls=1`
  - Zoom in and out buttons are only available if controls and Zoom are both enabled
  - Hand tool (pan button) is only available if controls and pan are both enabled
  - Reset canvas button and Help button are no longer available in embed mode

### Patch Changes

- [#289](https://github.com/statelyai/xstate-viz/pull/289) [`48af2ef`](https://github.com/statelyai/xstate-viz/commit/48af2ef6dc90afe9bfcf922e575dc9846ea8b5ea) Thanks [@farskid](https://github.com/farskid)! - Fix a bug with inconsistent embed previews

* [#278](https://github.com/statelyai/xstate-viz/pull/278) [`cd128a1`](https://github.com/statelyai/xstate-viz/commit/cd128a15486d9253edaaa360ee6c1b150f293f5c) Thanks [@farskid](https://github.com/farskid)! - Show full url in the embed code inside embed preview

- [#298](https://github.com/statelyai/xstate-viz/pull/298) [`0c3bfec`](https://github.com/statelyai/xstate-viz/commit/0c3bfec1925463b50ff443e4c74a9915c32aa32d) Thanks [@christoph-fricke](https://github.com/christoph-fricke)! - Align the visualization of custom actions with the visualization of XState-provided actions. Previously, the labels for custom actions were not rendered with a bold font.

* [#312](https://github.com/statelyai/xstate-viz/pull/312) [`d10238a`](https://github.com/statelyai/xstate-viz/commit/d10238a7c0e2d25f01fa076197d95ebf8369d421) Thanks [@Andarist](https://github.com/Andarist)! - Updated XState to its latest version ([4.26.0](https://github.com/statelyai/xstate/releases/tag/xstate%404.26.0)). Visualizer should be able to use the new goodies now, such as it should provide access to the `invoke.meta` object in the invoke creators.

- [#303](https://github.com/statelyai/xstate-viz/pull/303) [`2cb5ccf`](https://github.com/statelyai/xstate-viz/commit/2cb5ccfe5eb95ceb0919d247ba07ae70054dba5d) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed an issue where events were being duplicated in the right-hand events panel.

## 0.4.0

### Minor Changes

- [#209](https://github.com/statelyai/xstate-viz/pull/209) [`45cdb47`](https://github.com/statelyai/xstate-viz/commit/45cdb47349f2507ad3a8199d9938199f1261f11c) Thanks [@farskid](https://github.com/farskid)! - Embedded Mode!

  The visualizer/inspector can now be used in embedded mode. In this mode, some parts of the application can be configured such as control buttons, panning, zooming, etc.

  The embed preview frame lets users configure how they want the embedded visualizer to look:

  <img width="1214" alt="image" src="https://user-images.githubusercontent.com/8332043/134560683-5c654c59-799f-4f18-a927-bea0fd61ec34.png">

* [#198](https://github.com/statelyai/xstate-viz/pull/198) [`784ded9`](https://github.com/statelyai/xstate-viz/commit/784ded9f7c1ea63997cfd6faa95891db31462f38) Thanks [@mattpocock](https://github.com/mattpocock)! - Added generated OG images to visualized machine links. You can copy these links yourself to embed an up-to-date image of your visualized machine - for instance in docs. Here's where the share button is in the viz:

  ![Share button on Stately Viz](https://user-images.githubusercontent.com/28293365/134316316-70f2cd1d-aa05-409c-b058-4a46fc8af1b5.png)

- [#246](https://github.com/statelyai/xstate-viz/pull/246) [`22f1724`](https://github.com/statelyai/xstate-viz/commit/22f17242d85d86c6a3101900b0c90310d4c2b365) Thanks [@Andarist](https://github.com/Andarist)! - Added a hand icon to the canvas' toolbar:

  <img alt="Canvas toolbar with the hand icon" src="https://user-images.githubusercontent.com/9800850/133060078-30127739-1f8b-47fd-9f2b-308fc3c641bb.png" width="255" />

  This allows you to enable the "pan mode" to drag the canvas around without holding the spacebar button down at the same time.

### Patch Changes

- [#263](https://github.com/statelyai/xstate-viz/pull/263) [`4a0f041`](https://github.com/statelyai/xstate-viz/commit/4a0f041d52cb3c0c15d27244b83c41f5120bf28a) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with right-side panels getting cut off after stretching them and shrinking back with the resize handle.

* [#240](https://github.com/statelyai/xstate-viz/pull/240) [`fbb2f00`](https://github.com/statelyai/xstate-viz/commit/fbb2f006aebe5a0413f62274666cb69dcd00d0bc) Thanks [@mattpocock](https://github.com/mattpocock)! - Added support for using setInterval, setTimeout, clearInterval and clearTimeout in the viz.

- [#217](https://github.com/statelyai/xstate-viz/pull/217) [`92a2bba`](https://github.com/statelyai/xstate-viz/commit/92a2bbafba7455a15b13192ee69a03a719d857b7) Thanks [@mattpocock](https://github.com/mattpocock)! - Added a button to allow users to report any issues they find, using a GitHub issue template.

  ![Report an issue button in the info menu](https://user-images.githubusercontent.com/28293365/130981880-23bc25aa-e4af-4b9c-95b6-d2de3a7b5dec.png)

* [#238](https://github.com/statelyai/xstate-viz/pull/238) [`e074059`](https://github.com/statelyai/xstate-viz/commit/e074059d45247de5fbea116449c093728b7d3e6f) Thanks [@mattpocock](https://github.com/mattpocock)! - When you press visualize, machines will now automatically 'fit to view'. This prevents various bugs around state machines appearing not to be visible, when they're actually just off screen.

- [#214](https://github.com/statelyai/xstate-viz/pull/214) [`b9020a6`](https://github.com/statelyai/xstate-viz/commit/b9020a642d649d15de253779884a8fbe4710ccd0) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Multiple actors are now correctly visualized in the actors panel. This includes actors that are:

  - Created with `createMachine(...)` (automatically interpreted by default)
  - Invoked with `invoke: { ... }`
  - Spawned with `spawn(...)`

  <img width="935" alt="Screenshot showing multiple actors visible in the actors panel" src="https://user-images.githubusercontent.com/1093738/133617666-e36d525b-37b2-49a7-9354-92b7d3cd62ac.png">

* [#247](https://github.com/statelyai/xstate-viz/pull/247) [`bdbc892`](https://github.com/statelyai/xstate-viz/commit/bdbc892a010fc7dc3ef3f304348ecac60f62966e) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with the code editor becoming visually broken after saving a machine.

## 0.3.0

### Minor Changes

- [#215](https://github.com/statelyai/xstate-viz/pull/215) [`f030057`](https://github.com/statelyai/xstate-viz/commit/f0300575ca1e92c58cb0bcded8877d255530fe72) Thanks [@mattpocock](https://github.com/mattpocock)! - Added a welcome area for new users to help new folks understand what the viz can do.

  ![image](https://user-images.githubusercontent.com/28293365/130925861-93cd9ded-4126-4856-9e56-251c2a287478.png)

* [#210](https://github.com/statelyai/xstate-viz/pull/210) [`a8dbee6`](https://github.com/statelyai/xstate-viz/commit/a8dbee6b6c9aa44050d6da075ff86e7e61bbe869) Thanks [@davidkpiano](https://github.com/davidkpiano)! - You can now click the **Fit to view** button to fit your entire diagram into view:

  https://user-images.githubusercontent.com/1093738/130982742-f9523cd9-ca51-4981-ae94-68ba72971577.mp4

### Patch Changes

- [#203](https://github.com/statelyai/xstate-viz/pull/203) [`fd35c53`](https://github.com/statelyai/xstate-viz/commit/fd35c53c0d69b3fe57573c1699966dbcf157c35d) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with action buttons for the editor being often left out of the screen after viewport resizes.

* [#208](https://github.com/statelyai/xstate-viz/pull/208) [`a1b7379`](https://github.com/statelyai/xstate-viz/commit/a1b73790c2e09e30765d5e86f86fe40d019b0138) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with global keybindings being also triggered when providing input to input-like elements.

- [#228](https://github.com/statelyai/xstate-viz/pull/228) [`7ca7e9a`](https://github.com/statelyai/xstate-viz/commit/7ca7e9a83a8e8e3d8ce5c43890aa39d6b09a17ce) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The layout algorithm was parenting some of the edges incorrectly. This has been fixed.

  ![CleanShot 2021-08-30 at 07 14 58](https://user-images.githubusercontent.com/1093738/131331546-4a780c96-c58e-498e-aeaa-f44dc5e81fb4.png)

## 0.2.0

### Minor Changes

- [#190](https://github.com/statelyai/xstate-viz/pull/190) [`fd64139`](https://github.com/statelyai/xstate-viz/commit/fd64139f20325532e954b8c37fc3a996b522d83a) Thanks [@davidkpiano](https://github.com/davidkpiano)! - In the visualized machine, the entire event is now clickable.

* [#189](https://github.com/statelyai/xstate-viz/pull/189) [`77e808b`](https://github.com/statelyai/xstate-viz/commit/77e808bdf13dc334d06736030d09c28724f23e06) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Styles for invoked actors are now consistent with other action styles.

- [#182](https://github.com/statelyai/xstate-viz/pull/182) [`80f6966`](https://github.com/statelyai/xstate-viz/commit/80f69666118ce4edffb14cf822ab36eda7a2ec46) Thanks [@Andarist](https://github.com/Andarist)! - All keyboard shortcuts and keyboard-based interactions should now only allow platform-specific meta keys to be used. That means that on Mac they work with <kbd>CMD</kbd> and on other platforms they work with <kbd>Ctrl</kbd>.

* [#192](https://github.com/statelyai/xstate-viz/pull/192) [`87ffc50`](https://github.com/statelyai/xstate-viz/commit/87ffc50938f7670ff16d5cdfd1fa540e7baca79f) Thanks [@davidkpiano](https://github.com/davidkpiano)! - Sometimes, initial states will end up in an unexpected place, such as all the way to the right of the graph. This was due to the graph layout algorithm trying to prioritize _all_ transitions to point to the right, even transitions cycling back to the initial state. Now, transitions coming from the initial state are prioritized over all others, to ensure that the initial state ends up in an expected top-left placement.

### Patch Changes

- [#186](https://github.com/statelyai/xstate-viz/pull/186) Thanks [@santicros](https://github.com/santicros)! - Fixed an issue which caused browsers to zoom together with the visualization canvas when zooming using wheel.

* [#187](https://github.com/statelyai/xstate-viz/pull/187) [`1d69848`](https://github.com/statelyai/xstate-viz/commit/1d6984804fd29592c58ccb474693df43540d7215) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with inspector crashing on some inline action objects used in the config.

- [#195](https://github.com/statelyai/xstate-viz/pull/195) [`3ed3c0d`](https://github.com/statelyai/xstate-viz/commit/3ed3c0d02640c243cec08b21fd2d514727c1a7fd) Thanks [@davidkpiano](https://github.com/davidkpiano)! - The graph layout algorithm (using ELK) is now more resilient to layout failures caused by some layout options (such as compaction), so heuristics have been applied that make it more resilient to potential layout failures.

## 0.1.0

Initial release of the new Visualizer.
