/* Copyright 2016 Gholly All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
/// <reference path="../typings/index.d.ts" />

export enum NodeType {
  EXCITATORY,
  INHIBITORY
}

export enum NodeState {
  SPIKING,
  RESPIRATORY,
  DEFAULT
}

/**
*/
export class Node {
	id: string;
	type: NodeType;
  state: NodeState;
  layer: number;
  waitCount: number;
	inputLinks: Link[];
  outLinks: Link[];
  totalInput: number;
  output: number;
  threshold: number;

  	constructor(id: string, layer: number) {
    this.id = id;
    this.layer = layer;
    this.type = Math.random() > 0.8 ? NodeType.INHIBITORY : NodeType.EXCITATORY;
    this.state = NodeState.DEFAULT;
    this.inputLinks = [];
    this.outLinks = [];
    this.totalInput = 0;
    this.output = 0;
    this.threshold = 4.0;
    this.waitCount = 0;
  }

  /** Recomputes the node's state and output and returns it. */
  updateState(): number {
    // Computes total current input
    if(this.state == NodeState.SPIKING) {
      this.state = NodeState.RESPIRATORY;
      this.waitCount += 1;
      return 0;
    } else if (this.state == NodeState.RESPIRATORY && this.waitCount == 1) {
      this.waitCount += 1;
      return 0;
    } else if (this.state == NodeState.RESPIRATORY && this.waitCount == 2) {
      this.waitCount = 0;
      this.state = NodeState.DEFAULT;
    }

    let current_input = _.reduce(this.inputLinks,function(memo,l:Link){
      if(l.isActive) {
        let source = l.source;
        return memo + source.output;  
      } else {
        return memo;
      }
    	},0);
    this.totalInput += current_input;
    if(this.totalInput > this.threshold) {
    	if(this.type === NodeType.EXCITATORY) {
    		this.output = this.totalInput;
    	} else {
    		this.output = -this.totalInput;
    	}
      this.state = NodeState.SPIKING;
    	this.totalInput = 0;
    } else {
      this.state = NodeState.DEFAULT;
    	this.output = 0;
    }
    return this.output;
  }

  raisePotential(input: number) {
    this.totalInput += input;
    this.updateState();
  }
}

/**
 */
export class Link {
  id: string;
  source: Node;
  target: Node;
  weight:number;
  isActive: boolean;
  isSameLayerLink: boolean;
  
  /**
   * Constructs a link in the neural network initialized with random weight.
   *
   * @param source The source node.
   * @param dest The destination node.
   * @param regularization The regularization function that computes the
   *     penalty for this weight. If null, there will be no regularization.
   */
  constructor(source: Node, target: Node, weight: number) {
    this.id = source.id + "-" + target.id;
    this.source = source;
    this.target = target;
    this.weight = weight;
    this.isActive = this.weight > 0.9 ? true : false;
    this.isSameLayerLink = this.source.layer === this.target.layer;
  }

  sameLayerLink(): boolean {
    return this.source.layer === this.target.layer;
  }
}

/**
* @param networkShape The shape of the network. E.g. [10, 2, 3, 1] means
*   the network will have 10 input node, 2 nodes in first hidden layer,
*   3 nodes in second hidden layer and 1 output node.
*/

export class Network {
  networkShape: number[];
  numLayers: number;
  network: Node[][];
  links: Link[];
  nodes: Node[];
  m: number;
  spikingAvalancheCountArr;
  spikingAvalancheSizeArr;

  constructor(networkShape: number[]) {
    this.networkShape = networkShape;
    this.numLayers = networkShape.length;
    this.network = [];
    this.links = [];
    this.nodes = [];
    this.m = 1;
    this.spikingAvalancheCountArr = [];
    this.spikingAvalancheSizeArr = [];
    let id = 1;
    /** List of layers, with each layer being a list of nodes. */
    for (let layerIdx = 0; layerIdx < this.numLayers; layerIdx++) {
      let isOutputLayer = layerIdx === this.numLayers - 1;
      let isInputLayer = layerIdx === 0;
      let currentLayer: Node[] = [];
      this.network.push(currentLayer);
      let numNodes = this.networkShape[layerIdx];
      // create nodes on each layer
      for (let i = 0; i < numNodes; i++) {
        let nodeId = id.toString();
        id++;
        
        let node = new Node(nodeId,layerIdx);
        this.nodes.push(node);
        currentLayer.push(node);
        if (layerIdx >= 1) {
          // Add links from nodes in the previous layer to this node (links will be randomly active!!!).
          for (let j = 0; j < this.network[layerIdx - 1].length; j++) {
            let prevNode = this.network[layerIdx - 1][j];
            let link = new Link(prevNode, node, Math.random());
            this.links.push(link);
            prevNode.outLinks.push(link);
            node.inputLinks.push(link);
          }
        }
      }
      // add random links between nodes inside the current layer after build up
      for (let i = 1; i < numNodes; i++) {
        for (let j = 1; j < numNodes; j++) {
          if(i !== j) {
            let aNode = this.network[layerIdx][i];
            let bNode = this.network[layerIdx][j];
            let abLink = new Link(aNode,bNode,Math.random());
            this.links.push(abLink);
            aNode.outLinks.push(abLink);
            bNode.inputLinks.push(abLink);
          }
        }
      }
    }
  }

  addNeuron(layerIdx: number): void {
    //output layer
    if(layerIdx === this.numLayers - 1) {
      let candidateNodes = this.network[layerIdx];
    } 

  }

  removeNeuron(layerIdx: number): void {

  }

  addEdges(layerIdx: number): void {

  }

  rewireEdges(layerIdx: number): void {
    
  }

  getNode(id: string): Node {
    let candidateNode = _.filter(this.nodes,function(n){return n.id === id;});
    if(candidateNode.length === 1) {
      return candidateNode[0];
    } else {
      return new Node("-1",-1);
    }
  }
  
  forwardStep(inputs: number[]): boolean {
    let inputLayer = this.network[0];
    if (inputs.length > inputLayer.length) {
      throw new Error("The number of inputs must match the number of nodes in" +
          " the input layer");
    }
    let isStable = true;
    // Update the input layer.
    for (let i = 0; i < inputLayer.length; i++) {
      inputLayer[i].output = inputs[i];
    }
    for (let layerIdx = 1; layerIdx < this.network.length; layerIdx++) {
      let currentLayer = this.network[layerIdx];
      // Update all the nodes in this layer.
      for (let i = 0; i < currentLayer.length; i++) {
        let node = currentLayer[i];
        let nodeOutput = node.updateState();
        if(nodeOutput > 0) {
          isStable = false;
        } 
      }
    }
    return isStable;
  }

  stabilizeStep(): number {
   
    //let isStable = true;
    let spikingAvalancheSize = 0;
    for (let layerIdx = 1; layerIdx < this.network.length; layerIdx++) {
      let currentLayer = this.network[layerIdx];
        // Update all the nodes in this layer.
        for (let i = 0; i < currentLayer.length; i++) {
          let node = currentLayer[i];
          let nodeOutput = node.updateState();
          if(nodeOutput > 0) {
            // network is still not stable
            spikingAvalancheSize += 1;
            //isStable = false;
          } 
        }
    }
    // if positive network is still not stable
    return spikingAvalancheSize;
  }

  stabilizeAll(): number[] {
    let isStable = false;
    let spikingAvalancheCount = 0;
    let spikingAvalancheSize = 0;
    while(!isStable) {
      spikingAvalancheCount += 1;
      isStable = true;
      let additionalSpikingAvalancheSize = this.stabilizeStep();
      if(additionalSpikingAvalancheSize > 0) {
        spikingAvalancheSize += additionalSpikingAvalancheSize;
        isStable = false;
      }
    }
    this.spikingAvalancheCountArr.push(spikingAvalancheCount);
    this.spikingAvalancheSizeArr.push(spikingAvalancheSize);
    let outP = this.readOutput();
    return outP;
    //return _.map(this.network[this.network.length - 1],function(el){return el.totalInput;});
  }

  forwardInputMaybeStabilize(inputs: number[]): number[] {
      let stableAfterInput = this.forwardStep(inputs);
      if(!stableAfterInput) {
        return this.stabilizeAll();
      } else {
        return this.readOutput();
      }
  }

  readOutput(): number[] {
    return _.map(this.network[this.network.length - 1],function(el){return el.totalInput;});
  }

  activeLinks(): Link[] {
    return _.filter(this.links,function(l){return l.isActive;});
  }
}