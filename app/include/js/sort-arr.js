function sortBy(key, reversal) {
	return function(o, p) {
		var a = key ? o[key] : o,
			b = key ? p[key] : p;

		if (isNaN(a) || isNaN(b)) {  // 非数字排序
			var locale = navigator.language || navigator.systemLanguage;

			a = String(a);
			b = String(b);

			if (reversal) {
				return b.localeCompare(a, locale);  // 用本地特定顺序来比较
			}
			return a.localeCompare(b, locale);
		} else {
			return (a - b) * (reversal ? -1 : 1);
		}
	}
}