
import { execFile } from 'node:child_process';
import type { MavenEnvironment } from './maven-environment';

export interface MavenExecutionResult {
    stdout: string;
    stderr: string;
}

export interface MavenExecutionOptions {
    cwd?: string;
    timeoutMs?: number;
}

export class MavenExecutionError extends Error {
    constructor(message: string, stdout: string, stderr: string, exitCode: number | null, timedOut: boolean) {
        super(message);
        this.name = 'MavenExecutionError';
        this.stdout = stdout;
        this.stderr = stderr;
        this.exitCode = exitCode;
        this.timedOut = timedOut;
    }

    readonly stdout: string;
    readonly stderr: string;
    readonly exitCode: number | null;
    readonly timedOut: boolean;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_BUFFER_BYTES = 1024 * 1024;

export function runMavenVersion(environment: MavenEnvironment, options: MavenExecutionOptions = {}): Promise<MavenExecutionResult> {
    return new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';

        if (isWindows && environment.executable.includes('%')) {
            reject(new MavenExecutionError('Maven executable paths containing "%" are not supported by the Windows runner.', '', '', null, false));
            return;
        }

        const command = isWindows ? process.env.ComSpec || 'cmd.exe' : environment.executable;

        const args = isWindows ? ['/d', '/v:off', '/s', '/c', `""${environment.executable}" -version"`] : ['-version'];

        execFile(command, args, {
            cwd: options.cwd,
            encoding: 'utf8',
            timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
            maxBuffer: MAX_BUFFER_BYTES,
            windowsHide: true,
            windowsVerbatimArguments: isWindows
        }, (error, stdout, stderr) => {
            if (error) {
                reject(new MavenExecutionError(
                    error.message,
                    stdout,
                    stderr,
                    typeof error.code === 'number' ? error.code : null,
                    error.killed === true
                ));
                return;
            }

            resolve({stdout, stderr});
        });
    });
}
