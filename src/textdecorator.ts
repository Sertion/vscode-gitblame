import {workspace} from 'vscode';
import * as moment from 'moment';
import * as ObjectPath from 'object-path';
import {IGitBlameInfo, IGitCommitInfo} from './gitinterfaces';

export class TextDecorator {

    static toTextView(commit: IGitCommitInfo): string {
        const config = workspace.getConfiguration('gitblame');

        if (commit['hash'] === '0000000000000000000000000000000000000000') {
            return <string>config.get('statusBarMessageNoCommit');
        }
        else {
            const normalizedCommitInfo = TextDecorator.normalizeCommitInfoTokens(commit);
            const messageFormat = <string>config.get('statusBarMessageFormat');
            return TextDecorator.parseTokens(messageFormat, normalizedCommitInfo);
        }
    }

    static toDateText(dateNow: Date, dateThen: Date): string {
        return moment(dateThen).fromNow();
    }

    static parseTokens(target: string, tokens: object = {}): string {
        const tokenRegex = /\$\{([a-z\.\-\_]{1,})[,]*(|.{1,}?)(?=\})}/gi;

        return target.replace(tokenRegex, (string: string, key: string, inValue: string): string => {
            const currentToken = ObjectPath.get(tokens, key)
            const value = inValue.length > 0 ? inValue : undefined;

            if (typeof currentToken === 'string') {
                return currentToken;
            }
            else if (typeof currentToken === 'number') {
                return currentToken.toString();
            }
            else if (typeof currentToken === 'function') {
                let newString = currentToken.call(this, value, key);

                if (typeof newString === 'string') {
                    return newString;
                }
                else if (typeof newString === 'number') {
                    return newString.toString();
                }
            }

            return key;
        });
    }

    static normalizeCommitInfoTokens(commitInfo: IGitCommitInfo): Object {
        const now = new Date();
        const authorTime = moment.unix(commitInfo.author.timestamp);
        const committerTime = moment.unix(commitInfo.committer.timestamp);
        return {
            'commit': {
                'hash': commitInfo.hash,
                'hash_short': (length = 7) => commitInfo.hash.substr(0, length),
                'summary': commitInfo.summary,
                'filename': commitInfo.filename
            },
            'author': commitInfo.author,
            'committer': commitInfo.committer,
            'time': {
                'ago': () => TextDecorator.toDateText(now, authorTime.toDate()),
                'from': () => authorTime.fromNow(),
                'custom': (momentFormat) => authorTime.format(momentFormat),
                'c_ago': () => TextDecorator.toDateText(now, committerTime.toDate()),
                'c_from': () => committerTime.fromNow(),
                'c_custom': (momentFormat) => committerTime.format(momentFormat)
            }
        }
    }
}
