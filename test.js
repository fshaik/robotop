async function test() {
	 console.log('ho')
	 var promised = new Promise(function(resolve, reject) {
	 	setTimeout(() => resolve(500), 5000)
	 })
	 var result = await promised

	 console.log('ok')
}

test()