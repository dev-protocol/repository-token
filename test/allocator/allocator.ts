import {DevProtocolInstance} from '../test-lib/instance'
import BigNumber from 'bignumber.js'
import {PropertyInstance} from '../../types/truffle-contracts'
import {getPropertyAddress} from '../test-lib/utils/log'
import {
	validateErrorMessage,
	validatePauseErrorMessage,
	validatePauseOnlyOwnerErrorMessage,
} from '../test-lib/utils/error'

contract('Allocator', ([deployer, user1]) => {
	const init = async (): Promise<[DevProtocolInstance, PropertyInstance]> => {
		const dev = new DevProtocolInstance(deployer)
		await dev.generateAddressConfig()
		await Promise.all([
			dev.generateAllocator(),
			dev.generateAllocatorStorage(),
			dev.generateMarketFactory(),
			dev.generateMarketGroup(),
			dev.generateMetricsFactory(),
			dev.generateMetricsGroup(),
			dev.generateLockup(),
			dev.generateLockupStorage(),
			dev.generateWithdraw(),
			dev.generateWithdrawStorage(),
			dev.generatePropertyFactory(),
			dev.generatePropertyGroup(),
			dev.generateVoteTimes(),
			dev.generateVoteTimesStorage(),
			dev.generateVoteCounter(),
			dev.generateVoteCounterStorage(),
			dev.generatePolicyFactory(),
			dev.generatePolicyGroup(),
			dev.generatePolicySet(),
			dev.generateDev(),
		])
		await dev.dev.mint(deployer, new BigNumber(1e18).times(10000000))
		const policy = await artifacts.require('PolicyTestForAllocator').new()

		await dev.policyFactory.create(policy.address)
		const propertyAddress = getPropertyAddress(
			await dev.propertyFactory.create('test', 'TEST', deployer)
		)
		const [property] = await Promise.all([
			artifacts.require('Property').at(propertyAddress),
		])
		return [dev, property]
	}

	describe('Allocator: calculate', () => {
		it('If the difference between the start and end numbers is not appropriate, an error occurs.', async () => {
			const [dev, property] = await init()
			const res = await dev.allocator
				.calculate(property.address, 0, 1)
				.catch((err: Error) => err)
			validateErrorMessage(res, 'SafeMath: subtraction overflow', false)
		})
		it('If the difference between the start and end numbers is not appropriate, an error occurs.', async () => {
			const [dev, property] = await init()
			const res = await dev.allocator.calculate(property.address, 1, 1)
			expect(res[0].toNumber()).to.be.equal(0)
			expect(res[1].toNumber()).to.be.equal(0)
			expect(res[2].toNumber()).to.be.equal(0)
			expect(res[3].toNumber()).to.be.equal(0)
		})
		it('If there is no staker, only the holder is rewarded.', async () => {
			const [dev, property] = await init()
			const res = await dev.allocator.calculate(property.address, 10000, 10500)
			expect(res[0].toString()).to.be.equal('50000000000000000000000')
			expect(res[1].toNumber()).to.be.equal(0)
			expect(res[2].toString()).to.be.equal('50000000000000000000000')
			expect(res[3].toNumber()).to.be.equal(0)
		})
		it('If there is a staker, the holder and staker are rewarded.', async () => {
			const [dev, property] = await init()
			await dev.dev.deposit(property.address, 1000000)
			const res = await dev.allocator.calculate(property.address, 10000, 10500)
			expect(res[0].toString()).to.be.equal('45000000000000450000000')
			expect(res[1].toString()).to.be.equal('5000000000000050000000')
			expect(res[2].toString()).to.be.equal('45000000000000450000000')
			expect(res[3].toString()).to.be.equal('5000000000000050000000')
		})
		it('If there is a staker, the holder and staker are rewarded.', async () => {
			const [dev, property] = await init()
			await dev.dev.mint(user1, new BigNumber(1e18).times(10000000))
			console.log('*****************')
			await dev.dev.deposit(property.address, 1000000)
			console.log('*****************')
			await dev.dev.deposit(property.address, 2000000, {from: user1})
			console.log('*****************')
			const res = await dev.allocator.calculate(property.address, 10000, 10500)
			expect(res[0].toString()).to.be.equal('45000000000000450000000')
			expect(res[1].toString()).to.be.equal('5000000000000050000000')
			expect(res[2].toString()).to.be.equal('45000000000000450000000')
			expect(res[3].toString()).to.be.equal('5000000000000050000000')
		})
	})

	describe('Allocator; allocation', () => {
		it(`
		last allocation block is 5760,
		mint per block is 50000,
		locked-up is 300,
		total locked-up is 7406907;
		the result is ${5760 * 50000 * (300 / 7406907)}`, async () => {
			const [dev] = await init()
			const result = await dev.allocator.allocation(5760, 50000, 300, 7406907)
			expect(result.toNumber()).to.be.equal(~~(5760 * 50000 * (300 / 7406907)))
		})
	})

	describe('Allocator; pause', () => {
		it('pause and unpause this contract', async () => {
			const [dev, property] = await init()
			await dev.allocator.pause()
			const res = await dev.allocator
				.calculate(property.address, 0, 1000)
				.catch((err: Error) => err)
			validatePauseErrorMessage(res, false)
			await dev.allocator.unpause()
			await dev.allocator.calculate(property.address, 1, 1000)
		})

		it('Should fail to pause this contract when sent from the non-owner account', async () => {
			const [dev] = await init()
			const res = await dev.allocator
				.pause({from: user1})
				.catch((err: Error) => err)
			validatePauseOnlyOwnerErrorMessage(res)
		})
	})
})
