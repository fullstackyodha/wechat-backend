export class Helpers {
	static firstLetterUppercase(str: string): string {
		// Converts all the alphabetic characters in a string to lowercase.
		const valueString = str.toLowerCase();

		return valueString
			.split(' ')
			.map(
				(value: string) =>
					`${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`
			)
			.join(' ');
	}

	static lowerCase(str: string): string {
		return str.toLowerCase();
	}

	static escapeRegex(text: string): string {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}

	static generateRandomId(integerLength: number): number {
		const characters = '0123456789';
		const charactersLength = characters.length;

		let result = '';

		for (let i = 0; i < integerLength; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}

		return parseInt(result, 10);
	}

	static parseJson(prop: string): any {
		try {
			return JSON.parse(prop);
		} catch (error) {
			return prop;
		}
	}

	static isDataURL(value: string): boolean {
		const dataURLRegex =
			/^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\\/?%\s]*)\s*$/i;

		// Returns a Boolean value that indicates whether or not a pattern exists in a searched string
		return dataURLRegex.test(value);
	}

	static shuffle(list: string[]): string[] {
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}

		return list;
	}
}
