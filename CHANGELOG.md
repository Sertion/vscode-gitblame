# Change Log

## 10.8.0 (February 02, 2024)
* Feature: *Define a custom theme color for the inline message [#168](https://github.com/Sertion/vscode-gitblame/issues/168)* Thanks to [Johannes Rieken ](https://github.com/jrieken)
  * You can [customise the inline blame message by overriding `gitblame.inlineMessage`](https://code.visualstudio.com/docs/getstarted/themes#_customizing-a-color-theme)

## 10.7.1 (January 24, 2024)
* Bug: *Incorrect issues URL in changelog [#166](https://github.com/Sertion/vscode-gitblame/issues/166)* Thanks to [Minobi](https://github.com/Minobi)

## 10.7.0 (January 20, 2024)
* Feature: New setting `gitblame.revsFile` [#165](https://github.com/Sertion/vscode-gitblame/issues/165) Thanks to [mpawlowski-eyeo](https://github.com/mpawlowski-eyeo).
* Fix: Updating dependencies

## 10.6.0 (December 11, 2023)
* Bug/Breaking: *`gitblame.delayBlame` triggers for each character typed [#160](https://github.com/Sertion/vscode-gitblame/issues/160)* Thanks to [redactedscribe](https://github.com/redactedscribe).
* Fix: Updating dependencies

## 10.5.1 (September 24, 2023)
* Bug: *TypeError: Cannot read properties of undefined (reading 'toLowerCase') [#155](https://github.com/Sertion/vscode-gitblame/issues/155)* Thanks to [Andre Figueiredo](https://github.com/andretf)
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
* Bug: Attempting to fix *Extension causes high cpu load ([#145](https://github.com/Sertion/vscode-gitblame/issues/145))* Thanks to [joshrbarcodefactory](https://github.com/joshrbarcodefactory) for uploading the CPU snapshot!
* Fix: Updating dependencies
* Fix: Updated README.md

## 10.3.0 (June 23, 2023)
* Bug: Spawns many Git processes and uses up CPU ([#144](https://github.com/Sertion/vscode-gitblame/issues/144)) Thanks to [Theo Crandall](https://github.com/thrandale)!
  * New setting `gitblame.parallelBlames` controlls how many git blame processes that will run in parallel. Defaults to `2`.
* Bug: Blame completing can sometimes update the status bar to info from the wrong file
* Fix: Fewer dev dependencies

## 10.2.1 (June 21, 2023)
* Bug: Inline message drawn on top of code when backspacing from EOL ([#142](https://github.com/Sertion/vscode-gitblame/issues/142)) Thanks to [Kim Alford](https://github.com/kgalford1)!
* Fix: Hide blame decorator saving a file
* Fix: Updated unclear error message
* Fix: Added `${project.defaultbranch}` to the readme
* Fix: Updating dependencies

## 10.2.0 (April 8, 2023)
* Feature: Add a delay before blame is shown ([#139](https://github.com/Sertion/vscode-gitblame/issues/139)) [#141](https://github.com/Sertion/vscode-gitblame/pull/141). Thanks to [Ajith Aravind](https://github.com/aaravind100) for the PR and request!
  * Set `gitblame.delayBlame` to add a timeout from when navigating to a line to when the blame information is shown
* Feature:  Master or Main [#134](https://github.com/Sertion/vscode-gitblame/issues/134) (Thanks to [Pierre Hersant](https://github.com/elcortez))
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


## 9.0.1 (August 02, 2022)
* Fix: CHANGELOG.md headers are of the wrong level and other fixes
* Fix: Updating dependencies

## 9.0.0 (July 29, 2022)
* Breaking change: Removed `gitblame.isWebPathPlural`. Please use `gitblame.pluralWebPathSubstrings`.
* Breaking change: Removed `gitblame.statusBarMessageDisplayRight`. Status bar position is now always to the right.
* Feature: Apply `-C` option to git blame for more precise blaming in reorganized files [#125](https://github.com/Sertion/vscode-gitblame/issues/125) (Thanks to [Andy Li](https://github.com/Friendly-Robot))
* Feature: `gitblame.commitUrl` has a real value as default and no longer gives special meaning to an empty value
* Feature: Add new tokens to `gitblame.commitUrl`:
  * `${file.path.result}` - path to the final file
  * `${file.path.source}` - path to the original file
  * `${file.line.result}` - the line number of the line in the final file
  * `${file.line.source}` - the line number of the line in the original file
  * `${tool.protocol}` - `http:` or `https:`
  * `${tool.commitpath}` - `/commit/` or `/commits`
* Feature: New preview image
* Bug: 'View' button leads to dead link when repo is fully local [#128](https://github.com/Sertion/vscode-gitblame/issues/128) (Thanks to [Milli Beckers](https://github.com/emilyjbeckers))
* Fix: Updating the readme
* Fix: The `${commit.hash}` token now takes a parameter just like `${commit.hash_short,length}`
* Fix: Updating dependencies

## 8.2.3 (June 17, 2022)
* Bug: Reduce the amount of `git` calls
* Feature: Move to new build system with fewer dependencies
* Fix: Updating dependencies

## 8.2.2 (June 04, 2022)
* Bug: Errors get logged to console when directory is not using git [#124](https://github.com/Sertion/vscode-gitblame/issues/124) (Thanks to [Daniel Abromeit aka Abro](https://github.com/Abromeit))

## 8.2.1 (May 25, 2022)
* Fix: Updating dependencies
* Fix: CHANGELOG.md now has correct release date for 8.2.0
* Fix: CHANGELOG.md link to contributor

## 8.2.0 (May 13, 2022)
* Feature: Blame information as soon as it is avalible. This will allow some lines to show blame information while others still are waiting for `git blame`.
* Feature: Allow blaming symlinked files [#121](https://github.com/Sertion/vscode-gitblame/pull/121) (Thanks to [Angel Fraga Parodi](https://github.com/angelfraga))
* Bug: Blame info persistent over file change and file close [#115](https://github.com/Sertion/vscode-gitblame/issues/115) (Thanks to [Wenfang Du](https://github.com/wenfangdu) and [Viktor Stenqvist](https://github.com/Yottster))
* Bug: commit.summary before commit.hash_short causes display bug [#119](https://github.com/Sertion/vscode-gitblame/issues/119) (Thanks to [Cathryne Linenweaver](https://github.com/Cathryne))
* Bug: Remove right-to-left override characters from parsed text [#122](https://github.com/Sertion/vscode-gitblame/pull/122) (Thanks to [Chris Atkin](https://github.com/atkinchris))

## 8.1.0 (July 16, 2021)
* Fix: Avoid reloading for settings change [#112](https://github.com/Sertion/vscode-gitblame/pull/112) (Thanks to [João Moreno](https://github.com/joaomoreno))

## 8.0.1 (July 16, 2021)
* Feature: We now use vscodes language for Intl.RelativeTimeFormat locale [#111](https://github.com/Sertion/vscode-gitblame/issues/111) (Thanks to [AmosChenYQ](https://github.com/AmosChenYQ))
* Fix: CHANGELOG.md now has correct release date for 8.0.0

## 8.0.0 (July 15, 2021)
* Breaking change: Removed `${time.c_from}` and `${time.from}`, please use `${time.c_ago}` and `${time.ago}` instead. They have been aliases since version 3.0.0
* Breaking change: Dangling tokens (non-closed) now resolve correctly to their literal text instead of breaking
* Breaking change: Modifiers on tokens with parameters now work as expected
* Breaking change: Using Intl.RelativeTimeFormat to get relative time messages. This will change some things in the output:
  * Before `1 hour ago`, after `60 minutes ago`
  * Before `right now`, after `4 minutes ago`
  * etc.
* Breaking change: Output channel renamed from "gitblame" to "Git Blame"
* Feature: New setting (`gitblame.statusBarMessageDisplayRight`) will show status bar message to the right (Thanks to [João Moreno](https://github.com/joaomoreno))
* Feature: New setting (`gitblame.statusBarMessageClickAction`) will allow you to make clicks on the status bar directly open the tool URL (Thanks to [João Moreno](https://github.com/joaomoreno))
* Feature: Some info messages have changed.
* Feature: Now compiling for Node 14 and vscode ^1.57.0

## 7.0.6 (May 13, 2021)
* Bug: Issue with large blames caused some commits to be overwritten by empty versions of themselves (Thanks to [smcdef](https://github.com/smcdef) for reporting this)
* Bug: Last version was incorrectly marked as 7.0.4 in CHANGELOG.md

## 7.0.5 (May 13, 2021)
* Bug: Some lines are not blameable (Thanks to [smcdef](https://github.com/smcdef))

## 7.0.4 (May 09, 2021)
* Bug: Fix issue in token length function

## 7.0.3 (May 09, 2021)
* Bug: Git blame status bar info disappears on 7.0.2 [#102](https://github.com/Sertion/vscode-gitblame/issues/102) (Thanks to [smcdef](https://github.com/smcdef) and [Gene](https://github.com/geneaiello))
* Bug: Quick link not working [#103](https://github.com/Sertion/vscode-gitblame/issues/103) (Thanks to [Ricardo Faria](https://github.com/RicardoFariaSilva))

## 7.0.2 (May 08, 2021)
* Fix: Adding the fix from the previous release

## 7.0.1 (May 08, 2021)
* Bug: Git blame status bar info disappears on 7.0.0 [#101](https://github.com/Sertion/vscode-gitblame/issues/101) (Thanks to [Ben Reinhart](https://github.com/benjreinhart))

## 7.0.0 (May 07, 2021)
* Breaking change: Removing setting `gitblame.inferCommitUrl`. We will now always make an attempt at the URL.
* Feature: Added new token (`${gitorigin.path,n}`) for `gitblame.commitUrl`.
* Feature: Adding a tag to show we don't support the new virtual workspaces
* Fix: Updating dependencies

## 6.0.2 (December 20, 2020)
* Fix: Spelling error in CHANGELOG.md
* Bug: Stuck Waiting for git blame response (6.0.0) [#95](https://github.com/Sertion/vscode-gitblame/issues/95) (Thanks to [Vadzim Dambrouski](https://github.com/pftbest))

## 6.0.1 (December 19, 2020)
* Bug: Stuck Waiting for git blame response (6.0.0) [#95](https://github.com/Sertion/vscode-gitblame/issues/95) (Thanks to [Vadzim Dambrouski](https://github.com/pftbest))

## 6.0.0 (October 14, 2020)
* Breaking change: Removing setting `gitblame.logNonCritical` as we no longer produce any ciritcal errors
* Breaking change: The token `${|mod}` now expands to `|mod`, previously `${|mod}`
* Breaking change: Renamed output channel from "Extension: gitblame" to "gitblame"
* Bug: "Waiting for git blame response" (5.0.1) [#92](https://github.com/Sertion/vscode-gitblame/issues/92) (Thanks to [Dominik Zogg](https://github.com/dominikzogg) and [Alex Shelmire](https://github.com/shelmire))

## 5.0.1 (October 10, 2020)
* Feature: Faster load times
* Feature: Deactivation function for easier and faster uninstalls
* Fix: Reducing the number of dependencies
* Fix: Updating dependencies

## 5.0.0 (September 10, 2020)
* Breaking change: Previously we stripped the port from git origin. We now keep the port if the protocol is http or https.
* Feature Support HTTP git origins with port [#89](https://github.com/Sertion/vscode-gitblame/issues/89) (Thanks to [xgdgsc](https://github.com/xgdgsc))
* Fix: Updating dependencies

## 4.2.0 (July 24, 2020)
* Feature: Relative Path Token [#87](https://github.com/Sertion/vscode-gitblame/pull/87) (Thanks to [Ben](https://github.com/bwathen))

## 4.1.0 (July 09, 2020)
* Feature: Improve time ago estimate [#83](https://github.com/Sertion/vscode-gitblame/pull/83) (Thanks to [Ben Langlois](https://github.com/BenLanglois))
* Feature: Unable to open '': File is a directory. [#84](https://github.com/Sertion/vscode-gitblame/issues/84) (Thanks to [Matt Fletcher](https://github.com/MaffooBristol))
* Bug: Refixing [#3](https://github.com/Sertion/vscode-gitblame/issues/3)
* Fix: Updating dependencies
* Fix: Updated linters means pushing around code

## 4.0.1 (May 13, 2020)
* Bug: Undocumented change to [StatusBarItem api](https://code.visualstudio.com/api/references/vscode-api#StatusBarItem) [#82](https://github.com/Sertion/vscode-gitblame/issues/82) (Thanks to [Mike MacCana](https://github.com/mikemaccana))

## 4.0.0 (May 01, 2020)
* Deprication: Removing all depricated message token
* Feature: It is now able to limit the length of the summary [#81](https://github.com/Sertion/vscode-gitblame/issues/81) (Thanks to [Diab Neiroukh](https://github.com/lazerl0rd))

## 3.2.0 (March 09, 2020)
* Bug: No longer show a critical error when trying to blame a removed file [#78](https://github.com/Sertion/vscode-gitblame/issues/78) (Thanks to [Marius van Witzenburg](https://github.com/mariusvw))
* Feature: Move to new build system with fewer dependencies
* Feature: No longer bundle the feature gif into the install package

## 3.1.0 (February 23, 2020)
* Bug: Extension host crashing when renaming file [#59](https://github.com/Sertion/vscode-gitblame/issues/59) (Thanks to [pierznj](https://github.com/pierznj))
* Bug: Git command not found [#67](https://github.com/Sertion/vscode-gitblame/issues/67) (Thanks to [MarcMenghin](https://github.com/MarcMenghin))
* Bug: Documentation or text token is wrong [#70](https://github.com/Sertion/vscode-gitblame/issues/70) (Thanks to [MisLink](https://github.com/MisLink))
* Feature: Two new tokens for `gitblame.commitUrl` [#61](https://github.com/Sertion/vscode-gitblame/issues/61) (Thanks to [ajoga](https://github.com/ajoga) and [nitzel](https://github.com/nitzel))
* Fix: Adding [acknowledgements for the logo](https://twitter.com/jasonlong) [#63](https://github.com/Sertion/vscode-gitblame/issues/63) (Thanks to [Eonfge](https://github.com/Eonfge))
* Fix: Updating readme
* Fix: Updating dependencies

## 3.0.1 (August 02, 2019)
* Bug: Removing depricated token from default value for `gitblame.infoMessageFormat` [#57](https://github.com/Sertion/vscode-gitblame/issues/57) (Thanks to [Kyngo](https://github.com/Kyngo))

## 3.0.0 (July 27, 2019)
* Bug: Fixing rare bug where swapping between different file views didn't update the view
* Deprication: Removing the `.custom` tokens from status bar message
* Deprication: The `.from` token now is identical to `.ago`
* Deprication: Removing the `commit.filename` tokens from status bar message
* Deprication: Removing custom spinner support (`gitblame.progressSpinner`)
* Deprication: Removing log levels (`gitblame.logLevel`). It is replaced by `gitblame.logNonCritical` (defaults to `true`)
* Feature: Blame cache is now tied to the open document. Closing the document will clear if from the cache
* Feature: Move to the new `@types/vscode` and `vscode-test` packages
* Feature: Move to new build system
* Fix: Removeing or updating dependencies

The removal of the custom-token allows us to remove our dependency on moment. This lowers the extension bundle size from 850 kb to about 100 kb.

## 2.8.1 (June 21, 2019)
* Bug: Blaming a removed file crashes the extension [#54](https://github.com/Sertion/vscode-gitblame/pull/54) (Thanks to [dmitriismitnov](https://github.com/dmitriismitnov))
* Fix: Updating dependencies

## 2.8.0 (June 09, 2019)
* Feature: Auto detect Atlassian's BitBucket [#52](https://github.com/Sertion/vscode-gitblame/pull/52)
* Feature: Now display _X years ago_ instead of massive amounts of months [#53](https://github.com/Sertion/vscode-gitblame/pull/53) (Thanks to [radar](https://github.com/radar))
* Fix: Updating dependencies
* Fix: New linting rules

### BitBucket Detection

There is a new setting called `gitblame.pluralWebPathSubstrings`. It is an array of strings that, if present in the git origin url, will add an extra _S_ to the online tool url.

## 2.7.0 (March 27, 2019)

* Feature: Copy tool URL or hash to your clipboard with `gitblame.addToolUrlToClipboard` and `gitblame.addCommitHashToClipboard`! (Thanks to [tombusby](https://github.com/tombusby) for the suggestion)
* Fix: Updating dependencies

## 2.6.3 (November 30, 2018)

* Feature: Add support for using remote URL in blame link expansion [#50](https://github.com/Sertion/vscode-gitblame/pull/50) (Thanks to [allight](https://github.com/allight))

## 2.6.2 (November 27, 2018)

* Fix: Updating dependencies

## 2.6.1 (November 15, 2018)

* Bug: Dot in username generates wrong repository URL [#48](https://github.com/Sertion/vscode-gitblame/pull/48) (Thanks to [bolduz](https://github.com/bolduz))

## 2.6.0 (November 05, 2018)

* Feature: We can now parse a wider variety of git origin formats [#46](https://github.com/Sertion/vscode-gitblame/pull/46)
* Feature: You can now use your project name in `vscode.commitUrl` [#46](https://github.com/Sertion/vscode-gitblame/pull/46)
* Fix: Updating dependencies

## 2.5.1 (October 28, 2018)

* Bug: Remote URLs without `.git` are now handled correctly [#44](https://github.com/Sertion/vscode-gitblame/pull/44) (Thanks to [dewe](https://github.com/dewe))

## 2.5.0 (October 21, 2018)

* Bug: Sometimes gitblame blamed the same file multiple time in parallel. This is no longer the case.
* Feature: We now use `vscode.git` to find your git binary.
* Fix: Change the default info message format to be prefixed by the date instead of the commit hash. It is in ISO 8601 with dashes for separator.
* Fix: Updating Readme to better guide Bitbucket users to the `isWebPathPlural` setting.
* Fix: Removed `internalHashLength` setting. We now alsways use the whole hash.
* Fix: Moved back to using [`fs.watch`](https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener) from [`workspace.FileSystemWatcher`](https://code.visualstudio.com/docs/extensionAPI/vscode-api#workspace.createFileSystemWatcher) after getting reposts that file watching is having issues.
* Fix: Better handling of ENOENT in git command runner. [#41](https://github.com/Sertion/vscode-gitblame/pull/41) (Thanks to [Yottster](https://github.com/Yottster))
* Fix: Moved to strict TypeScript.
* Fix: Updating dependencies

## 2.4.4 (August 01, 2018)

* Fix: Updating dependencies

## 2.4.3 (August 01, 2018)

* Bug: Showing unedited gitblame info template when running *Show quick Info* on unblameable line (Thanks to [BerndErnst](https://github.com/BerndErnst))
* Bug: Using a map instead of an object for storing git blame file cache. Now we can blame files named `__proto__` etc.

## 2.4.2 (April 05, 2018)

* Bug: Blame uses committer not author [#29](https://github.com/Sertion/vscode-gitblame/issues/29), [#32](https://github.com/Sertion/vscode-gitblame/issues/32), and [#33](https://github.com/Sertion/vscode-gitblame/issues/33) (Thanks to [HCoban](https://github.com/HCoban), [richardscarrott](https://github.com/richardscarrott), and [KenCoder](https://github.com/KenCoder))

## 2.4.1 (March 30, 2018)

* Bug: defaultWebPath handles plural not correctly [#30](https://github.com/Sertion/vscode-gitblame/issues/30) (Thanks to [HCoban](https://github.com/HCoban))

## 2.4.0 (March 26, 2018)

* Feature: Added `gitblame.isWebPathPlural`. Setting for GitBucket users to help the new auto detect feature. [PR#28](https://github.com/Sertion/vscode-gitblame/pull/28) (Thanks to [dimitarnestorov](https://github.com/dimitarnestorov))

## 2.3.1 (March 24, 2018)

* Fix: Updating Readme

## 2.3.0 (March 24, 2018)

* Feature: Atempting to auto detect if you use a known git web interface [#15](https://github.com/Sertion/vscode-gitblame/issues/15) (Thanks to [@Fidge123](https://github.com/Fidge123), [@sabrehagen](https://github.com/sabrehagen), [@henvic](https://github.com/henvic), and an extra thanks to [@neerolyte](https://github.com/neerolyte))
* Feature: Added `gitblame.statusBarPositionPriority` for moving the status bar view [#25](https://github.com/Sertion/vscode-gitblame/issues/25) (Thanks to [@jvoigt](https://github.com/jvoigt))
* Fix: Merging `GitBlame` and `GitBlameController` to `GitBlame`
* Fix: Renaming `GitBlameFile*` to `GitFile*`
* Fix: Rewrote all the tests
* Fix: Updating dependencies
* Fix: Updating preview video/image
* Enhancement: Prettifying with [Prettier](https://prettier.io/)
* Enhancement: Tslintifying with [TSLint](https://palantir.github.io/tslint/)

## 2.2.0 (September 07, 2017)

* Feature: Multiple workspace support [#23](https://github.com/Sertion/vscode-gitblame/issues/23) (Thanks to [@IgorNovozhilov](https://github.com/IgorNovozhilov))
* Fix: Updating dependencies

## 2.1.0 (August 12, 2017)

* Bug: Keep current line blame info when opening `gitblame.quickInfo`
* Bug: No longer tells you that your custom git path is incorrect
* Bug: Supports git paths with spaces in them
* Feature: Allow for shorter internal git hash storage (`gitblame.internalHashLength`)

## 2.0.2 (July 24, 2017)

* Bug: Spinner will spin forever when there is no repo to be found

## 2.0.1 (July 20, 2017)

* Fix: Moving `git.path` message from `critical` to `error`

## 2.0.0 (July 20, 2017)

This will be updating the major version as we are changing what the exposed command is called.

* Fix: Change name of the command to `gitblame.quickInfo` (was `extension.blame`)
* Fix: Updating the _Known issues_ link to the new issue tracker as all old issues are resolved
* Fix: Moved to TypeScript 2.4.1
* Fix: Cleaning imports
* Fix: Remove Q&A-section from vscode marketplace
* Fix: No more `null`
* Fix: Renamed all interfaces (removed the `I`-prefix)
* Bug: Only try to blame files in our `workspace.rootPath`
* Bug: Adding missing _the_ in tooltip
* Bug: Adding better `dispose` handling
* Feature: Adding command (`gitblame.blameLink`) for online blame
* Feature: Adding a fancy _loading spinner_ when waiting for blaming information
* Feature: Clear the cache of closed files from time to time
* Feature: Replacing [git-blame](https://github.com/alessioalex/git-blame) with our own `--incremental` based solution
* Feature: Killing the `git blame` process when requesting a re-blame
* Feature: Logging when we run commands and what command it was
* Feature: More informative logging
* Feature: Time stamps in the log
* Feature: Adding setting to limit what log levels gets logged

## 1.11.3 (June 15, 2017)

* Bug: Blaming the wrong line [#20](https://github.com/Sertion/vscode-gitblame/issues/20) (Thanks to [@gucong3000](https://github.com/gucong3000))

## 1.11.2 (June 06, 2017)

* Bug: Updating issue link in change log [#19](https://github.com/Sertion/vscode-gitblame/issues/19) (Thanks to [@adambowles](https://github.com/adambowles))
* Fix: Updating dependencies

## 1.11.1 (June 05, 2017)

* Bug: Singular for single number minutes, hours, and days [#18](https://github.com/Sertion/vscode-gitblame/issues/18) (Thanks to [@adambowles](https://github.com/adambowles))

## 1.11.0 (June 05, 2017)

* Bug: Singular for single number months [#16](https://github.com/Sertion/vscode-gitblame/issues/16) (Thanks to [@adambowles](https://github.com/adambowles))
* Fix: Adding additional tests for checking `toDateText`
* Fix: Watching only blamed files

## 1.10.0 (May 21, 2017)

* Feature: Adding support for git submodules [#12](https://github.com/Sertion/vscode-gitblame/issues/12)

## 1.9.0 (May 15, 2017)

* Bug: Fix link in CHANGELOG.md
* Fix: Moved to TypeScript 2.1.5
* Bug: Allow for underscore in tokens
* Fix: Using `async`/`await` where appropriate
* Bug: Allow token functions do declare default values
* Fix: Moving editor and document validation to its on file
* Fix: Moving git repository finding process to its own file
* Feature: Adding a better tool for handling informative errors to the user
* Feature: Listening to file changes in the repository and generates new git blame info if an external tool changes a file

## 1.8.2 (May 14, 2017)

* Bug: Fix incorrect version number in CHANGELOG.md [#13](https://github.com/Sertion/vscode-gitblame/pull/13) (Thanks to [@zackschuster](https://github.com/zackschuster))
* Fix: Removing `typings` directory
* Feature: Now respects `git.path` (Thanks to [@alessioalex](https://github.com/alessioalex)) [#4](https://github.com/Sertion/vscode-gitblame/issues/4)
* Feature: Adding short hash token to `infoMessageFormat` and `statusBarMessageFormat` [#10](https://github.com/Sertion/vscode-gitblame/issues/10)

## 1.8.1 (May 01, 2017)

* Bug: Fix incorrect file name in imports [#9](https://github.com/Sertion/vscode-gitblame/issues/9) (Thanks to [@pftbest](https://github.com/pftbest))

## 1.8.0 (May 01, 2017)

* Feature: Customizable status bar message format [#5](https://github.com/Sertion/vscode-gitblame/issues/5)
* Feature: Customizable `infoMessage` format
* Enhancement: Updating installation instructions

## 1.7.1 (April 30, 2017)

* Enhancement: Use the same cache for `showMessage` and `view.refresh`

## 1.7.0 (April 30, 2017)

* Feature: Adding setting to ignore whitespace changes (`gitblame.ignoreWhitespace`) [#1](https://github.com/Sertion/vscode-gitblame/issues/1)
* Feature: Adding setting to open commit info in online tool (`gitblame.commitUrl`) [#6](https://github.com/Sertion/vscode-gitblame/issues/6)
* Enhancement: Status bar message no longer clickable when there is no commit associated with the current line
* Enhancement: Adding info about configuration in `README.md`
* Bug: Spawn fewer git processes when opening a file [#3](https://github.com/Sertion/vscode-gitblame/issues/3)

## 1.6.2 (April 29, 2017)

* Updating example animation
* Removing backlog from `README.md`, it is now the [`Planned` label in the issue tracker](https://github.com/Sertion/vscode-gitblame/labels/Planned)

## 1.6.1 (April 29, 2017)

* Split change log into its own file as per [suggestion from @daniel-white](https://github.com/waderyan/vscode-gitblame/issues/30)

## 1.6.0 (April 17, 2017)

* More granular time info
* Adding a re-check of blame info on save

## 1.5.0 (April 17, 2017)

* Spring cleaning

## 1.4.0 (April 16, 2017)

* Now respects changes made in the git working tree when blaming
* Updating dependencies
* Updating to new repository

## 1.3.0 (July 21, 2016)

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/12) to make the status bar message interactive (credit to [@j-em](https://github.com/j-em));

## 1.2.0 (July 20, 2016)

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/10) replacing 'Hello World' message with hash and commit message (credit to [@carloscz](https://github.com/carloscz)).

## 1.1.0 (May 20, 2016)

* Reduced text size which was causing the blame info not to show.
* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/5) (credit to [@fogzot](https://github.com/fogzot)) that searches for .git in parent dirs.
