import { PatchProviderInstance } from '../../../types/truffle-contracts'
import { validateErrorMessage } from '../../test-lib/utils/error'

contract('PatchProvider', ([admin, operator, user1, dummy]) => {
	const getPatchProvider = async (): Promise<PatchProviderInstance> => {
		const patchProvider = await artifacts.require('PatchProvider').new()
		await patchProvider.addOperator(operator)
		return patchProvider
	}

	const getAdminAndOperatorAddresses = (): string[] => {
		return [admin, operator]
	}

	describe('setPatch', () => {
		describe('success', () => {
			it('get patch address and setter address', async () => {
				const testFunc = async (executer: string): Promise<void> => {
					const patchProvider = await getPatchProvider()
					const patch = await artifacts
						.require('PatchPlane')
						.new(patchProvider.address)
					await patchProvider.setPatch(patch.address, { from: executer })
					expect(await patchProvider.patch()).to.be.equal(patch.address)
					expect(await patchProvider.patchSetter()).to.be.equal(executer)
				}

				for await (const executer of getAdminAndOperatorAddresses()) {
					await testFunc(executer)
				}
			})
		})
		describe('fail', () => {
			it('Cannot be executed from an unauthorized wallet.', async () => {
				const patchProvider = await getPatchProvider()
				const result = await patchProvider
					.setPatch(dummy, { from: user1 })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'does not have operator role')
			})
			it('If the upgrader is different, an error will occur.', async () => {
				const patchProvider = await getPatchProvider()
				const patch = await artifacts.require('PatchPlane').new(dummy)

				const result = await patchProvider
					.setPatch(patch.address, { from: operator })
					.catch((err: Error) => err)
				validateErrorMessage(result, 'upgrader is different')
			})
		})
	})
	describe('isPatchAddress', () => {
		it('we can see if it is a patch contract address.', async () => {
			const patchProvider = await getPatchProvider()
			const patch = await artifacts
				.require('PatchPlane')
				.new(patchProvider.address)
			await patchProvider.setPatch(patch.address)
			let result = await patchProvider.isPatchAddress(patch.address)
			expect(result).to.be.equal(true)
			result = await patchProvider.isPatchAddress(dummy)
			expect(result).to.be.equal(false)
		})
	})
})
