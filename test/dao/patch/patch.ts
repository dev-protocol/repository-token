/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable max-nested-callbacks */
import {
	AddressConfigInstance,
	StorageContractInstance,
} from '../../../types/truffle-contracts'
import { validateErrorMessage } from '../../test-lib/utils/error'
import { DEFAULT_ADDRESS } from '../../test-lib/const'

contract('Patch', ([deployer, upgrader, operator]) => {
	describe('constructor', () => {
		it('it can get the set upgrader address.', async () => {
			const patch = await artifacts.require('PatchPlane').new(upgrader)
			const upgraderAddress = await patch.upgrader()
			expect(upgraderAddress).to.be.equal(upgrader)
		})
	})

	describe('getDevMinter', () => {
		it('get the set dev minter address', async () => {
			const patch = await artifacts.require('PatchPlane').new(upgrader)
			const addressConfig = await artifacts.require('AddressConfig').new()
			const devMinter = await artifacts
				.require('DevMinter')
				.new(addressConfig.address)
			const lockup = await artifacts
				.require('Lockup')
				.new(addressConfig.address, devMinter.address)
			await addressConfig.setLockup(lockup.address)
			await patch.setConfigAddress(addressConfig.address, { from: upgrader })
			const devminterAddress = await patch.getDevMinterTest()
			expect(devminterAddress).to.be.equal(devMinter.address)
		})
	})

	describe('setConfigAddress', () => {
		describe('success', () => {
			it('get the set config address', async () => {
				const patch = await artifacts.require('PatchPlane').new(upgrader)
				const addressConfig = await artifacts.require('AddressConfig').new()
				expect(await patch.config()).to.be.equal(DEFAULT_ADDRESS)
				await patch.setConfigAddress(addressConfig.address, { from: upgrader })
				expect(await patch.config()).to.be.equal(addressConfig.address)
			})
		})
		describe('fail', () => {
			it('only executed by upgrader contract', async () => {
				const patch = await artifacts.require('PatchPlane').new(upgrader)
				const result = await patch
					.setConfigAddress(DEFAULT_ADDRESS)
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal access')
			})
			it('if we execute pause, we can not set config address', async () => {
				const patch = await artifacts.require('PatchPlane').new(upgrader)
				await patch.pause()
				const result = await patch
					.setConfigAddress(DEFAULT_ADDRESS, { from: upgrader })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'Pausable: paused')
			})
		})
	})

	describe('afterRun', () => {
		describe('success', () => {
			it('The owner of AddressConfig can be an upgrader.', async () => {
				const patch = await artifacts.require('PatchPlane').new(upgrader)
				const addressConfig = await artifacts.require('AddressConfig').new()
				await addressConfig.transferOwnership(patch.address)
				await patch.setConfigAddress(addressConfig.address, { from: upgrader })
				expect(await addressConfig.owner()).to.be.equal(patch.address)
				await patch.afterRun({ from: upgrader })
				expect(await addressConfig.owner()).to.be.equal(upgrader)
			})
		})
		describe('fail', () => {
			it('Cannot be set except from the upgrader.', async () => {
				const patch = await artifacts.require('PatchPlane').new(upgrader)
				const result = await patch.afterRun().catch((err: Error) => err)
				validateErrorMessage(result, 'illegal access')
			})
			it('Can not set it if it is paused.', async () => {
				const patch = await artifacts.require('PatchPlane').new(upgrader)
				await patch.pause()
				const result = await patch
					.afterRun({ from: upgrader })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'Pausable: paused')
			})
		})
	})

	describe('afterDeployUsingStorage', () => {
		it('Storage permissions transition and the owner becomes the upgrader.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await storageContract.increment()
			expect((await storageContract.getValue()).toString()).to.be.equal('1')

			await addressConfig.setLockup(storageContract.address)
			const upgrader = await artifacts
				.require('Upgrader')
				.new(addressConfig.address)
			await storageContract.transferOwnership(upgrader.address)
			await upgrader.addOperator(operator)
			await addressConfig.transferOwnership(upgrader.address)
			const patch = await artifacts.require('PatchPlane').new(upgrader.address)
			await upgrader.setPatch(patch.address)
			await upgrader.execute(false, { from: operator })
			const next = await addressConfig.lockup()
			const nextStorageContract = await artifacts
				.require('StorageContract')
				.at(next)
			expect(await storageContract.owner()).to.be.equal(upgrader.address)
			expect(await nextStorageContract.owner()).to.be.equal(upgrader.address)
			const beforeStorageAddress = await storageContract.getStorageAddress()
			const afterStorageAddress = await nextStorageContract.getStorageAddress()
			expect(beforeStorageAddress).to.be.equal(afterStorageAddress)

			await nextStorageContract.increment()
			expect((await nextStorageContract.getValue()).toString()).to.be.equal('2')
			const result = await storageContract
				.increment()
				.catch((err: Error) => err)
			validateErrorMessage(result, 'not current owner')
		})
	})
})

contract('Patch(afterDeploy)', ([deployer, operator, current]) => {
	const getUpgraderEvent = async (
		addressConfig: AddressConfigInstance,
		patchName: string,
		generateCurrentContract: StorageContractInstance | undefined = undefined
	): Promise<any> => {
		const upgrader = await artifacts
			.require('Upgrader')
			.new(addressConfig.address)
		if (typeof generateCurrentContract !== 'undefined') {
			await generateCurrentContract.transferOwnership(upgrader.address)
		}

		await upgrader.addOperator(operator)
		await addressConfig.transferOwnership(upgrader.address)
		const patch = await artifacts.require(patchName).new(upgrader.address)
		await upgrader.setPatch(patch.address)
		const tx = await upgrader.execute(false, { from: operator })
		const eventArgs = tx.logs.filter((log: Truffle.TransactionLog) => {
			return log.event === 'Upgrade'
		})[0].args
		return eventArgs
	}

	describe('afterDeploy', () => {
		it('Allocator will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			await addressConfig.setAllocator(current)

			const eventArgs = await getUpgraderEvent(addressConfig, 'PatchAllocator')

			const next = await addressConfig.allocator()
			expect(eventArgs._name).to.be.equal('Allocator')
			expect(eventArgs._current).to.be.equal(current)
			expect(eventArgs._next).to.be.equal(next)
		})

		it('MarketFactory will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			await addressConfig.setMarketFactory(current)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchMarketFactory'
			)

			const next = await addressConfig.marketFactory()
			expect(eventArgs._name).to.be.equal('MarketFactory')
			expect(eventArgs._current).to.be.equal(current)
			expect(eventArgs._next).to.be.equal(next)
		})

		it('MetricsFactory will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			await addressConfig.setMetricsFactory(current)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchMetricsFactory'
			)

			const next = await addressConfig.metricsFactory()
			expect(eventArgs._name).to.be.equal('MetricsFactory')
			expect(eventArgs._current).to.be.equal(current)
			expect(eventArgs._next).to.be.equal(next)
		})

		it('PropertyFactory will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			await addressConfig.setPropertyFactory(current)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchPropertyFactory'
			)

			const next = await addressConfig.propertyFactory()
			expect(eventArgs._name).to.be.equal('PropertyFactory')
			expect(eventArgs._current).to.be.equal(current)
			expect(eventArgs._next).to.be.equal(next)
		})

		it('Withdraw will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await addressConfig.setWithdraw(storageContract.address)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchWithdraw',
				storageContract
			)

			const next = await addressConfig.withdraw()
			expect(eventArgs._name).to.be.equal('Withdraw')
			expect(eventArgs._current).to.be.equal(storageContract.address)
			expect(eventArgs._next).to.be.equal(next)
		})

		it('VoteCounter will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await addressConfig.setVoteCounter(storageContract.address)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchVoteCounter',
				storageContract
			)

			const next = await addressConfig.voteCounter()
			expect(eventArgs._name).to.be.equal('VoteCounter')
			expect(eventArgs._current).to.be.equal(storageContract.address)
			expect(eventArgs._next).to.be.equal(next)
		})

		it('PropertyGroup will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await addressConfig.setPropertyGroup(storageContract.address)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchPropertyGroup',
				storageContract
			)

			const next = await addressConfig.propertyGroup()
			expect(eventArgs._name).to.be.equal('PropertyGroup')
			expect(eventArgs._current).to.be.equal(storageContract.address)
			expect(eventArgs._next).to.be.equal(next)
		})
		it('PolicyGroup will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await addressConfig.setPolicyGroup(storageContract.address)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchPolicyGroup',
				storageContract
			)

			const next = await addressConfig.policyGroup()
			expect(eventArgs._name).to.be.equal('PolicyGroup')
			expect(eventArgs._current).to.be.equal(storageContract.address)
			expect(eventArgs._next).to.be.equal(next)
		})
		it('PolicyFactory will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			await addressConfig.setPolicyFactory(current)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchPolicyFactory'
			)

			const next = await addressConfig.policyFactory()
			expect(eventArgs._name).to.be.equal('PolicyFactory')
			expect(eventArgs._current).to.be.equal(current)
			expect(eventArgs._next).to.be.equal(next)

			const nextpolicyFactory = artifacts.require('PolicyFactory').at(next)
			expect(await nextpolicyFactory.owner()).to.be.equal(deployer)
		})
		it('MetricsGroup will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await addressConfig.setMetricsGroup(storageContract.address)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchMetricsGroup',
				storageContract
			)

			const next = await addressConfig.metricsGroup()
			expect(eventArgs._name).to.be.equal('MetricsGroup')
			expect(eventArgs._current).to.be.equal(storageContract.address)
			expect(eventArgs._next).to.be.equal(next)
		})
		it('MarketGroup will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await addressConfig.setMarketGroup(storageContract.address)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchMarketGroup',
				storageContract
			)

			const next = await addressConfig.marketGroup()
			expect(eventArgs._name).to.be.equal('MarketGroup')
			expect(eventArgs._current).to.be.equal(storageContract.address)
			expect(eventArgs._next).to.be.equal(next)
		})
		it('Lockup will be updated.', async () => {
			const addressConfig = await artifacts.require('AddressConfig').new()
			const storageContract = await artifacts.require('StorageContract').new()
			await storageContract.createStorage()
			await addressConfig.setLockup(storageContract.address)

			const eventArgs = await getUpgraderEvent(
				addressConfig,
				'PatchLockup',
				storageContract
			)

			const next = await addressConfig.lockup()
			expect(eventArgs._name).to.be.equal('Lockup')
			expect(eventArgs._current).to.be.equal(storageContract.address)
			expect(eventArgs._next).to.be.equal(next)
		})
	})
})
