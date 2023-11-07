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
}
