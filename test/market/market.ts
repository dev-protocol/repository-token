contract('MarketTest', ([deployer, u1]) => {
	const marketContract = artifacts.require('merket/Market')
	const dummyDEVContract = artifacts.require('DummyDEV')
	const addressConfigContract = artifacts.require('config/AddressConfig')
	const policyContract = artifacts.require('policy/PolicyTest')
	const policyFactoryContract = artifacts.require('policy/PolicyFactory')

	describe('Market; schema', () => {
		it('Get Schema of mapped Behavior Contract')
	})

	describe('Market; authenticate', () => {
		it('Proxy to mapped Behavior Contract')

		it(
			'Should fail to run when sent from other than the owner of Property Contract'
		)

		it(
			'Should fail to the transaction if the second argument as ID and a Metrics Contract exists with the same ID.'
		)
	})

	describe('Market; authenticatedCallback', () => {
		it('Create a new Metrics Contract')

		it(
			'Market Contract address and Property Contract address are mapped to the created Metrics Contract'
		)

		it(
			'Should fail to create a new Metrics Contract when sent from non-Behavior Contract'
		)
	})

	describe('Market; calculate', () => {
		it('Proxy to mapped Behavior Contract')
	})

	describe('Market; vote', () => {
		let dummyDEV: any
		let market: any
		let addressConfig: any
		let policy: any
		let policyFactory: any
		beforeEach(async () => {
			dummyDEV = await dummyDEVContract.new('Dev', 'DEV', 18, 10000, {
				from: deployer
			})
			addressConfig = await addressConfigContract.new({from: deployer})
			await addressConfig.setToken(dummyDEV.address, {from: deployer})
			policy = await policyContract.new({from: deployer})
			policyFactory = await policyFactoryContract.new(addressConfig.address, {
				from: deployer
			})
			await addressConfig.setPolicyFactory(policyFactory.address, {
				from: deployer
			})
			await policyFactory.createPolicy(policy.address)
		})

		it('Vote as a positive vote, votes are the number of sent DEVs', async () => {
			market = await marketContract.new(addressConfig.address, u1, false, {
				from: deployer
			})
			await dummyDEV.approve(market.address, 40, {from: deployer})

			await market.vote(10, {from: deployer})
			const firstTotalVotes = await market.totalVotes({from: deployer})

			expect(firstTotalVotes.toNumber()).to.be.equal(10)

			await market.vote(20, {from: deployer})
			const secondTotalVotes = await market.totalVotes({from: deployer})
			expect(secondTotalVotes.toNumber()).to.be.equal(30)
		})

		it('When total votes for more than 10% of the total supply of DEV are obtained, this Market Contract is enabled', async () => {
			market = await marketContract.new(addressConfig.address, u1, false, {
				from: deployer
			})
			await dummyDEV.approve(market.address, 1000, {from: deployer})

			await market.vote(1000, {from: deployer})
			const isEnable = await market.enabled({from: deployer})

			expect(isEnable).to.be.equal(true)
		})

		it('Should fail to vote when already determined enabled', async () => {
			market = await marketContract.new(addressConfig.address, u1, true, {
				from: deployer
			})
			await dummyDEV.approve(market.address, 100, {from: deployer})

			const result = await market
				.vote(100, {from: deployer})
				.catch((err: Error) => err)
			expect(result).to.instanceOf(Error)
		})

		it('Vote decrease the number of sent DEVs from voter owned DEVs', async () => {
			market = await marketContract.new(addressConfig.address, u1, false, {
				from: deployer
			})
			await dummyDEV.approve(market.address, 100, {from: deployer})

			await market.vote(100, {from: deployer})
			const ownedDEVs = await dummyDEV.balanceOf(deployer, {from: deployer})

			expect(ownedDEVs.toNumber()).to.be.equal(9900)
		})

		it('Vote decrease the number of sent DEVs from DEVtoken totalSupply', async () => {
			market = await marketContract.new(addressConfig.address, u1, false, {
				from: deployer
			})
			await dummyDEV.approve(market.address, 100, {from: deployer})

			await market.vote(100, {from: deployer})
			const DEVsTotalSupply = await dummyDEV.totalSupply({from: deployer})

			expect(DEVsTotalSupply.toNumber()).to.be.equal(9900)
		})
		it('voting deadline is over', async () => {})
	})
})
