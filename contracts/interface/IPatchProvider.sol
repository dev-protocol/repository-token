// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.5.17;

interface IPatchProvider {
	function patch() external view returns (address);

	function patchSetter() external view returns (address);

	function setPatch(address _patch) external;

	function isPatchAddress(address _patch) external view returns (bool);
}
