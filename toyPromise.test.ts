import { ToyPromise } from "./toyPromise";

describe("ToyPromise", () => {
	// 1. 값 전달 테스트
	test("should pass value through then", async () => {
		const result = await new ToyPromise((res) => res(1)).then().then((v) => v);
		expect(result).toBe(1);
	});

	// 2. thenable 평탄화 테스트
	test("should flatten thenable", async () => {
		const result = await new ToyPromise((res) => res(1)).then(
			(v) => new ToyPromise((res) => res((v as number) * 2)),
		);
		expect(result).toBe(2);
	});

	// 3. reject 전파 테스트
	test("should propagate rejection", async () => {
		const result = await new ToyPromise((_, rej) => rej?.("error"))
			.then((v) => (v as number) * 2)
			.catch((e) => e);
		expect(result).toBe("error");
	});

	// 4. 예외 처리 테스트
	test("should catch thrown error", async () => {
		const result = await new ToyPromise((res) => res(1))
			.then(() => {
				throw new Error("boom");
			})
			.catch((e) => (e as Error).message);
		expect(result).toBe("boom");
	});

	// 5. finally 테스트
	test("should run finally and pass value through", async () => {
		let finallyCalled = false;
		const result = await new ToyPromise((res) => res(1))
			.finally(() => {
				finallyCalled = true;
			})
			.then((v) => v);
		expect(finallyCalled).toBe(true);
		expect(result).toBe(1);
	});

	// 6. static resolve/reject 테스트
	test("static resolve should work", async () => {
		const result = await ToyPromise.resolve(42).then((v) => v);
		expect(result).toBe(42);
	});

	test("static reject should work", async () => {
		const result = await ToyPromise.reject("error").catch((e) => e);
		expect(result).toBe("error");
	});

	// 7. 체이닝 테스트
	test("should chain correctly", async () => {
		const result = await new ToyPromise((resolve) => resolve(1))
			.then((v) => (v as number) * 10)
			.then((v) => (v as number) + 10);
		expect(result).toBe(20);
	});

	// 8. 비동기 thenable 테스트
	test("should handle async thenable", async () => {
		function later(v: unknown, t = 50) {
			return new ToyPromise((res) => setTimeout(() => res(v), t));
		}
		const result = await new ToyPromise((res) => res(1))
			.then((v) => later((v as number) * 2))
			.then((v) => later((v as number) + 3));
		expect(result).toBe(5);
	});

	// 9. onRejected 복구 테스트
	test("should recover from rejection in onRejected", async () => {
		const result = await new ToyPromise((_, reject) => reject!(new Error("X")))
			.then(
				() => "unreachable",
				() => "recovered",
			)
			.then((v) => v);
		expect(result).toBe("recovered");
	});

	// 10. catch + finally 체이닝
	test("should chain catch and finally", async () => {
		let cleanupCalled = false;
		const result = await new ToyPromise((_, rej) => rej!("boom"))
			.catch(() => "handled")
			.finally(() => {
				cleanupCalled = true;
			})
			.then((v) => v);
		expect(result).toBe("handled");
		expect(cleanupCalled).toBe(true);
	});

	// 11. microtask 순서 테스트
	test("should execute in correct microtask order", async () => {
		const order: string[] = [];
		order.push("start");
		setTimeout(() => order.push("macrotask"), 0);
		await ToyPromise.resolve(undefined).then(() => order.push("microtask"));
		order.push("end");
		// microtask should run before the function returns
		expect(order).toEqual(["start", "microtask", "end"]);
	});

	// 12. all 테스트
	test("should resolve all promises", async () => {
		const result = await ToyPromise.all([ToyPromise.resolve(1), ToyPromise.resolve(2)]);
		expect(result).toEqual([1, 2]);
	});

	// 13. race 테스트
	test("should resolve the first promise", async () => {
		const result = await ToyPromise.race([new ToyPromise((res) => setTimeout(() => res(1), 1000)), new ToyPromise((res) => setTimeout(() => res(2), 2000))]);
		expect(result).toBe(1);
	});

	// 14. thenable 테스트
	test("should resolve thenable", async () => {
		const thenable = {
			then(onFulfilled: (value: unknown) => unknown) { onFulfilled(42); }
		};

		const result = await new ToyPromise(res => res(thenable))
			.then(v => v);
		expect(result).toBe(42);
	});
});
