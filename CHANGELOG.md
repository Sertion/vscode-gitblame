# Change Log

## 11.1.2 (February 14, 2025)
* Bug: Fix gitorigin.port error for http(s) [#188](https://github.com/Sertion/vscode-gitblame/pull/182). Thanks to [yuanliuu](https://github.com/yuanliuu)!
* Fix: Updating dependencies
* Fix: Update CHANGELOG.md format

## 11.1.1 (October 10, 2024)
* Fix: Fix for Default value of gitblame.commitUrl [#182](https://github.com/Sertion/vscode-gitblame/pull/182). Thanks to [Kovbas](https://github.com/Kovbas)!
* Fix: Split the changelog into two files. Old changes live in [CHANGELOG OLD.md](./CHANGELOG%20OLD.md)
* FIX: Update release date for 11.1.0.

## 11.1.0 (October 03, 2024)
* Feature: Adding a new setting that modifies the `user.name` and `committer.name` token: `gitblame.currentUserAlias`. [#181](https://github.com/Sertion/vscode-gitblame/issues/181). Thanks to [Antecer](https://github.com/Antecer)!
 * When set its value will be printed instead of the name when the commit author or committer email matches the current git config `user.email`.
* Fix: Updating dependencies

## 11.0.2 (July 17, 2024)
* Feature: Adding logging behind the `debug` and `trace` levels.
* Fix: Updating dependencies

## 11.0.1 (May 29, 2024)
* Bug: Environment parameters are no longer sent to git commands [#174](https://github.com/Sertion/vscode-gitblame/issues/174). Thanks to [Martijn Hols](https://github.com/MartijnHols), [amc6](https://github.com/amc6), and especially [Alex Neo](https://github.com/alexneo2003)!

## 11.0.0 (May 21, 2024)
* Feature: Will no longer blame files with more lines than `gitblame.maxLineCount` (default `16384`) [#172](https://github.com/Sertion/vscode-gitblame/issues/172). Thanks to [webextensions](https://github.com/webextensions)!
  * Fun fact: This number was selected as it is the last power of 2 lower than 20000. It has no other significance.

## 10.11.0 (May 09, 2024)
* Feature: *Copy commit hash on info message click [#171](https://github.com/Sertion/vscode-gitblame/issues/171)*. Thanks to [Harsh](https://github.com/harshbhatt)!
* Fix: Updating dependencies

## 10.10.1 (April 30, 2024)
* Bug: *Status Bar block disappears after a change in extension settings [#155](https://github.com/Sertion/vscode-gitblame/issues/155)*. Thanks to [ADTC](https://github.com/ADTC)!
* Fix: Updating dependencies

## 10.10.0 (March 12, 2024)
* Feature: Update extension to support [the future move to SHA-256 hashes for object names](https://github.com/git/git/blob/70661d28/Documentation/technical/hash-function-transition.txt)
* Fix: Change from `rome` to `@biomejs/biome`
* Fix: Updating dependencies

## 10.9.0 (February 06, 2024)
* Feature: Moving "Waiting for git blame response" to the tool tip and replacing the spinning icon with a non-spinning version while waiting for blame information for a line. [#167](https://github.com/Sertion/vscode-gitblame/issues/163) Thanks to [Benjamin Pasero](https://github.com/bpasero) and [Jasper Trooster](https://github.com/Japsert)!

## 10.8.0 (February 02, 2024)
* Feature: *Define a custom theme color for the inline message [#168](https://github.com/Sertion/vscode-gitblame/issues/168)*. Thanks to [Johannes Rieken ](https://github.com/jrieken)!
  * You can [customise the inline blame message by overriding `gitblame.inlineMessage`](https://code.visualstudio.com/docs/getstarted/themes#_customizing-a-color-theme)

## 10.7.1 (January 24, 2024)
* Bug: *Incorrect issues URL in changelog [#166](https://github.com/Sertion/vscode-gitblame/issues/166)*. Thanks to [Minobi](https://github.com/Minobi)!

## 10.7.0 (January 20, 2024)
* Feature: New setting `gitblame.revsFile` [#165](https://github.com/Sertion/vscode-gitblame/issues/165) Thanks to [mpawlowski-eyeo](https://github.com/mpawlowski-eyeo)!
* Fix: Updating dependencies

## 10.6.0 (December 11, 2023)
* Bug/Breaking: *`gitblame.delayBlame` triggers for each character typed [#160](https://github.com/Sertion/vscode-gitblame/issues/160)*. Thanks to [redactedscribe](https://github.com/redactedscribe)!
* Fix: Updating dependencies

## 10.5.1 (September 24, 2023)
* Bug: *TypeError: Cannot read properties of undefined (reading 'toLowerCase') [#155](https://github.com/Sertion/vscode-gitblame/issues/155)*. Thanks to [Andre Figueiredo](https://github.com/andretf)!
* Fix: Builds now target ES2022
* Fix: Updating dependencies

## 10.5.0 (August 25, 2023)
* Known issue: `gitblame.gitShow` does not work in some shells
* Fix: Use absolute path to determine when a git repository HEAD changes
* Fix: Respect the `gitblame.parallelBlames` settings after a vscode relaunch
* Fix: Updating dependencies
* Fix: Updated README.md

## 10.4.0 (July 08, 2023)
* Feature: Open `git show` for the commit on the last selected line in the terminal from the info message or from the `gitblame.gitShow` command
  * It is also possible to change the status bar button default behavor to run git show by changing `gitblame.statusBarMessageClickAction` to `"Open git show"`
* Bug: Attempting to fix *Extension causes high cpu load ([#145](https://github.com/Sertion/vscode-gitblame/issues/145))*. Thanks to [joshrbarcodefactory](https://github.com/joshrbarcodefactory) for uploading the CPU snapshot!
* Fix: Updating dependencies
* Fix: Updated README.md

## 10.3.0 (June 23, 2023)
* Bug: Spawns many Git processes and uses up CPU ([#144](https://github.com/Sertion/vscode-gitblame/issues/144)). Thanks to [Theo Crandall](https://github.com/thrandale)!
  * New setting `gitblame.parallelBlames` controls how many git blame processes that will run in parallel. Defaults to `2`.
* Bug: Blame completing can sometimes update the status bar to info from the wrong file
* Fix: Fewer dev dependencies

## 10.2.1 (June 21, 2023)
* Bug: Inline message drawn on top of code when backspacing from EOL ([#142](https://github.com/Sertion/vscode-gitblame/issues/142)). Thanks to [Kim Alford](https://github.com/kgalford1)!
* Fix: Hide blame decorator saving a file
* Fix: Updated unclear error message
* Fix: Added `${project.defaultbranch}` to the readme
* Fix: Updating dependencies

## 10.2.0 (April 8, 2023)
* Feature: Add a delay before blame is shown ([#139](https://github.com/Sertion/vscode-gitblame/issues/139)) [#141](https://github.com/Sertion/vscode-gitblame/pull/141). Thanks to [Ajith Aravind](https://github.com/aaravind100) for the PR and request!
  * Set `gitblame.delayBlame` to add a timeout from when navigating to a line to when the blame information is shown
* Feature:  Master or Main [#134](https://github.com/Sertion/vscode-gitblame/issues/134). Thanks to [Pierre Hersant](https://github.com/elcortez)!
  * New token for `gitblame.commitUrl`: `${project.defaultbranch}` - The current projects default branch
* Fix: Updating dependencies

## 10.1.0 (December 19, 2022)
* Feature: Now uses the new [LogOutputChannel](https://code.visualstudio.com/api/references/vscode-api#LogOutputChannel)
* Fix: Removing unused setting from README.md. Thanks to [RAZINJ](https://github.com/razinj) for the [PR](https://github.com/Sertion/vscode-gitblame/pull/136)!
* Fix: Updating dependencies

## 10.0.0 (November 23, 2022)
* Feature: Inline view of gitblame [#94](https://github.com/Sertion/vscode-gitblame/issues/94). Thanks to [f4n0](https://github.com/f4n0) for the PR and [kramarz89](https://github.com/kramarz89) for the request!
  * `gitblame.inlineMessageEnabled` to enable the feature
  * `gitblame.inlineMessageFormat` to configure the message format
  * `gitblame.inlineMessageNoCommit` to set the _no commit_ message
  * `gitblame.inlineMessageMargin` to configure the distance between the end of the line and the blame info
  * Use the same token as for `gitblame.statusBarMessageFormat`
* Fix: Updating dependencies

# Older Changes

For older changes please see [CHANGELOG OLD.md](./CHANGELOG%20OLD.md).
