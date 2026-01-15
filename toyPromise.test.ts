import { ToyPromise } from "./toyPromise";

// 1. 값 전달 테스트
// new ToyPromise((res) => res(1))
// 	.then()
// 	.then((v: unknown) => console.log(v)); // 1

// 2. thenable 평탄화 테스트
// new ToyPromise((res) => res(1))
// 	.then((v) => new ToyPromise((res) => res((v as number) * 2)))
// 	.then((v) => console.log(v)); // 2

// 3. reject 전파 테스트
new ToyPromise((_, rej) => rej?.("error"))
	.then((v) => (v as number) * 2)
	.catch((e) => console.log(e)); // 'error'

// 4. 예외 처리 테스트
new ToyPromise((res) => res(1))
	.then((v) => {
		throw new Error("boom");
	})
	.catch((e) => console.log(e.message)); // 'boom'

// 5. finally 테스트
// new ToyPromise((res) => res(1))
//   .finally(() => console.log('finally'))
//   .then((v: unknown) => console.log(v)); // 1

// 6. static resolve/reject 테스트
// ToyPromise.resolve(42).then((v: unknown) => console.log(v)); // 42
// ToyPromise.reject('error').catch((e: unknown) => console.log(e)); // 'error'

// 7. 체이닝 테스트
// const p = new ToyPromise((resolve) => resolve(1));
// p.then(v => (v as number) * 10)
//   .then(v => (v as number) + 10)
//   .then(v => console.log('완성된 값', v)); // 20

// 8. 비동기 thenable 테스트
// function later(v: unknown, t = 50) {
// 	return new ToyPromise((res) => setTimeout(() => res(v), t));
// }
// new ToyPromise((res) => res(1))
// 	.then((v) => later((v as number) * 2))
// 	.then((v) => later((v as number) + 3))
// 	.then((v) => console.log(v)); // 5

// 9. onRejected 복구 테스트
// new ToyPromise((_, reject) => reject(new Error("X")))
// 	.then(
// 		() => "unreachable",
// 		(err) => "recovered",
// 	)
// 	.then((v) => console.log(v)) // 'recovered'
// 	.catch(() => console.log("should not run"));

// 10. catch + finally 체이닝
// new ToyPromise((_, rej) => rej("boom"))
// 	.catch((e) => "handled")
// 	.finally(() => console.log("cleanup"))
// 	.then((v) => console.log(v)); // 'handled'

// 11. microtask 순서 테스트
// console.log("start");
// setTimeout(() => console.log("macrotask"), 0);
// ToyPromise.resolve().then(() => console.log("microtask"));
// console.log("end");
// 출력: start -> end -> microtask -> macrotask
