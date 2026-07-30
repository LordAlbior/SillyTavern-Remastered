import { SlashCommandExecutor } from './SlashCommandExecutor.ts';

export class SlashCommandBreak extends SlashCommandExecutor {
    get value() {
        return this.unnamedArgumentList[0]?.value;
    }
}
