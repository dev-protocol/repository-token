/* eslint-disable @typescript-eslint/await-thenable */
import {
	AddressConfigInstance,
	UpgraderInstance,
	PatchPlaneInstance,
} from '../../../types/truffle-contracts'
import { validateErrorMessage } from '../../test-lib/utils/error'
import { DEFAULT_ADDRESS } from '../../test-lib/const'

contract('DevProtocolAccess', ([admin, operator, user1, dummy]) => {
	const getTestInstance = async (
		patchName = 'PatchPlane',
		patchSetter = admin
	): Promise<[UpgraderInstance, AddressConfigInstance, PatchPlaneInstance]> => {
		const addressConfig = await artifacts.require('AddressConfig').new()
		const upgrader = await artifacts
			.require('Upgrader')
			.new(addressConfig.address)
		const patch = await artifacts.require(patchName).new(upgrader.address)
		await upgrader.addOperator(operator)
		await upgrader.setPatch(patch.address, { from: patchSetter })
		return [upgrader, addressConfig, patch]
	}

	describe('execute', () => {
		describe('success', () => {
			it('Update the contract. In doing so, remove the mint role from the old DevMinter contract and assign the mint role to the new DevMinter contract.', async () => {
				const [upgrader, addressConfig, patch] = await getTestInstance(
					'PatchLockup'
				)
				const dev = await artifacts.require('Dev').new(addressConfig.address)
				const devMinter = await artifacts
					.require('DevMinter')
					.new(addressConfig.address)
				await dev.addMinter(devMinter.address)
				await dev.addMinter(upgrader.address)
				const lockup = await artifacts
					.require('Lockup')
					.new(addressConfig.address, devMinter.address)
				await lockup.createStorage()
				await lockup.transferOwnership(upgrader.address)
				await addressConfig.setLockup(lockup.address)
				await addressConfig.setToken(dev.address)
				await addressConfig.transferOwnership(upgrader.address)
				await devMinter.transferOwnership(upgrader.address)

				expect(await patch.paused()).to.be.equal(false)
				expect(await dev.isMinter(devMinter.address)).to.be.equal(true)
				expect(await addressConfig.owner()).to.be.equal(upgrader.address)
				expect(await upgrader.patch()).to.be.equal(patch.address)
				expect(await upgrader.patchSetter()).to.be.equal(admin)
				const tx = await upgrader.execute(true, { from: operator })
				const nextLockup = tx.logs.filter((log) => {
					return log.event === 'Upgrade' && log.args._name === 'Lockup'
				})[0].args._next
				expect(await addressConfig.lockup()).to.be.equal(nextLockup)
				expect(await patch.paused()).to.be.equal(true)
				expect(await addressConfig.owner()).to.be.equal(upgrader.address)
				expect(await dev.isMinter(devMinter.address)).to.be.equal(false)
				const nextLockupInstance = await artifacts
					.require('Lockup')
					.at(nextLockup)
				const nextDevMinterAddress = await nextLockupInstance.devMinter()
				expect(await dev.isMinter(nextDevMinterAddress)).to.be.equal(true)
				expect(await upgrader.patch()).to.be.equal(DEFAULT_ADDRESS)
				expect(await upgrader.patchSetter()).to.be.equal(DEFAULT_ADDRESS)
			})
			it('Update the contract.', async () => {
				const [upgrader, addressConfig, patch] = await getTestInstance(
					'PatchPlane2'
				)
				await addressConfig.transferOwnership(upgrader.address)
				expect(await addressConfig.allocator()).to.be.equal(DEFAULT_ADDRESS)
				expect(await patch.paused()).to.be.equal(false)
				expect(await addressConfig.owner()).to.be.equal(upgrader.address)
				expect(await upgrader.patch()).to.be.equal(patch.address)
				expect(await upgrader.patchSetter()).to.be.equal(admin)
				const tx = await upgrader.execute(false, { from: operator })
				const nextAllocator = tx.logs.filter((log) => {
					return log.event === 'Upgrade' && log.args._name === 'Allocator'
				})[0].args._next
				expect(await addressConfig.allocator()).to.be.equal(nextAllocator)
				expect(await patch.paused()).to.be.equal(true)
				expect(await addressConfig.owner()).to.be.equal(upgrader.address)
				expect(await upgrader.patch()).to.be.equal(DEFAULT_ADDRESS)
				expect(await upgrader.patchSetter()).to.be.equal(DEFAULT_ADDRESS)
			})
			it('Can be run by admin and operator', async () => {
				const testFunc = async (
					setPatcher: string,
					executer: string
				): Promise<void> => {
					const [upgrader, addressConfig] = await getTestInstance(
						'PatchPlane2',
						setPatcher
					)
					await upgrader.addOperator(admin)
					await addressConfig.transferOwnership(upgrader.address)
					await upgrader.execute(false, { from: executer })
				}

				await testFunc(admin, operator)
				await testFunc(operator, admin)
			})
		})
		describe('fail', () => {
			it('If the wallet where the patch contract address is set and the wallet where the execute function is executed are the same, an error occurs.', async () => {
				const [upgrader] = await getTestInstance()
				const result = await upgrader.execute(false).catch((err: Error) => err)
				validateErrorMessage(result, 'not another operator')
			})
			it('Error when patch contract is in pause state.', async () => {
				const [upgrader, , patch] = await getTestInstance()
				await patch.pause()
				const result = await upgrader
					.execute(false, { from: operator })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'already executed')
			})
			it('If the wallet does not have Admin or operator privileges, an error will occur.', async () => {
				const [upgrader] = await getTestInstance()
				const result = await upgrader
					.execute(false, { from: user1 })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'does not have operator role')
			})
		})
	})

	describe('addUpgradeEvent', () => {
		describe('fail', () => {
			it('Access from outside the patch contract will result in an error.', async () => {
				const [upgrader] = await getTestInstance()
				const result = await upgrader
					.addUpgradeEvent('dummy', dummy, dummy, { from: user1 })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'illegal access')
			})
		})
	})
})
