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
  x: number;
  y: number;

  	constructor(id: string, layer: number) {
    this.id = id;
    this.layer = layer;
    this.type = Math.random() > 0.8 ? NodeType.INHIBITORY : NodeType.EXCITATORY;
    this.state = NodeState.DEFAULT;
    this.inputLinks = [];
    this.outLinks = [];
    this.totalInput = 0;
    this.output = 0;
    this.threshold = 0.5;
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
    		this.output = this.totalInput/this.outLinks.length;
    	} else {
    		this.output = -this.totalInput/this.outLinks.length;
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
  constructor(source: Node, target: Node, weight: number, activeThreshold: number = 0.95) {
    this.id = source.id + "-" + target.id;
    this.source = source;
    this.target = target;
    this.weight = weight;
    this.isActive = this.weight > activeThreshold ? true : false;
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
  maxM: number;
  spikingAvalancheCountArr;
  spikingAvalancheSizeArr;

  constructor(networkShape: number[], growAtOnce: boolean = true, m: number = 5) {
    this.networkShape = networkShape;
    this.m = m;
    this.maxM = this.networkShape[1];
    this.numLayers = networkShape.length;
    this.network = [];
    this.links = [];
    this.nodes = [];
    this.spikingAvalancheCountArr = [];
    this.spikingAvalancheSizeArr = [];
    let id = 1;

    //create nodes with m nodes on hidden layer
     for (let layerIdx = 0; layerIdx < this.numLayers; layerIdx++) {
      let isOutputLayer = layerIdx === this.numLayers - 1;
      let isInputLayer = layerIdx === 0;
      let currentLayer: Node[] = [];
      this.network.push(currentLayer);
      let numNodes = isInputLayer || isOutputLayer ? this.networkShape[layerIdx] : this.m;
      // create nodes on each layer
      for (let i = 0; i < numNodes; i++) {
        let nodeId = id.toString();
        id++;
        
        let node = new Node(nodeId,layerIdx);
        this.nodes.push(node);
        currentLayer.push(node);
      }
    }

    // add random links between hidden nodes
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.m; j++) {
        if(i !== j) {
          let aNode = this.network[1][i];
          let bNode = this.network[1][j];
          let abLink = new Link(aNode,bNode,Math.random(),0.4);
          this.links.push(abLink);
          aNode.outLinks.push(abLink);
          bNode.inputLinks.push(abLink);
        }
      }
    }

    // add links from input to hidden nodes
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.networkShape[0]; j++) {
        let inputNode = this.network[0][j];
        let hiddenNode = this.network[1][i];
        let link = new Link(inputNode, hiddenNode, Math.random(),0.75);
        this.links.push(link);
        inputNode.outLinks.push(link);
        hiddenNode.inputLinks.push(link);
       }
    }

    // add links from hidden to output nodes
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.networkShape[2]; j++) {
        let outputNode = this.network[2][j];
        let hiddenNode = this.network[1][i];
        let link = new Link(hiddenNode, outputNode, Math.random(),0.75);
        this.links.push(link);
        hiddenNode.outLinks.push(link);
        outputNode.inputLinks.push(link);
      }
    }

    // grow the network to the specified size
    if(growAtOnce) {
      this.grow();
    } 
    /** Create input nodes, hidden nodes, output nodes */
    // for (let layerIdx = 0; layerIdx < this.numLayers; layerIdx++) {
    //   let isOutputLayer = layerIdx === this.numLayers - 1;
    //   let isInputLayer = layerIdx === 0;
    //   let currentLayer: Node[] = [];
    //   this.network.push(currentLayer);
    //   let numNodes = this.networkShape[layerIdx];
    //   // create nodes on each layer
    //   for (let i = 0; i < numNodes; i++) {
    //     let nodeId = id.toString();
    //     id++;
        
    //     let node = new Node(nodeId,layerIdx);
    //     this.nodes.push(node);
    //     currentLayer.push(node);
    //   }
    // }

    // // add random links between hidden nodes
    // for (let i = 0; i < this.networkShape[1]; i++) {
    //   for (let j = 0; j < this.networkShape[1]; j++) {
    //     if(i !== j) {
    //       let aNode = this.network[1][i];
    //       let bNode = this.network[1][j];
    //       let abLink = new Link(aNode,bNode,Math.random());
    //       this.links.push(abLink);
    //       aNode.outLinks.push(abLink);
    //       bNode.inputLinks.push(abLink);
    //     }
    //   }
    // }

    // // add links from input to hidden nodes
    // for (let i = 0; i < this.networkShape[1]; i++) {
    //   for (let j = 0; j < this.networkShape[0]; j++) {
    //     let inputNode = this.network[0][j];
    //     let hiddenNode = this.network[1][i];
    //     let link = new Link(inputNode, hiddenNode, Math.random());
    //     this.links.push(link);
    //     inputNode.outLinks.push(link);
    //     hiddenNode.inputLinks.push(link);
    //    }
    // }

    // // add links from hidden to output nodes
    // for (let i = 0; i < this.networkShape[1]; i++) {
    //   for (let j = 0; j < this.networkShape[2]; j++) {
    //     let outputNode = this.network[2][j];
    //     let hiddenNode = this.network[1][i];
    //     let link = new Link(hiddenNode, outputNode, Math.random());
    //     this.links.push(link);
    //     hiddenNode.outLinks.push(link);
    //     outputNode.inputLinks.push(link);
    //   }
    // }
  }

  grow() {
    while(this.hiddenNodes().length < this.maxM) {
      this.growStep();
    }
  }

  growStep() {

    if(this.hiddenNodes().length < this.maxM) {
      // create new node
      
      let node = new Node((this.nodes.length + 1).toString(),1);

      let allIncEdges = _.reduce(this.nodes, function(memo, n: Node){return memo + n.inputLinks.length;},0);
      let nodesNum = this.nodes.length;
      
      for(let i = 0; i < this.m; i++) {
        let shuffled = _.shuffle(this.nodes);
        for(let j = 0; j < nodesNum; j++) {
          let cn = <Node>shuffled[j];
          let p = cn.inputLinks.length / allIncEdges;
          if(Math.random() <= p) {
            let link = new Link(node, cn, 1.0);
            this.links.push(link);
            node.outLinks.push(link);
            cn.inputLinks.push(link);
            break;
          }
        }
      }

      this.nodes.push(node);
      this.network[1].push(node);
    }
    
  }

  addNeuron(layerIdx: number): void {
    
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

  // returns if after input network is stable or not
  forwardStep(inputs: number[]): boolean {
    console.log("forwardstep", inputs);
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

  activeLinks(hiddenOnly: boolean = true): Link[] {
    let nL = this.numLayers;
    return _.filter(this.links,function(l:Link){return l.isActive && l.sameLayerLink() && l.source.layer > 0 && l.source.layer < (nL - 1);});
  }

  hiddenNodes(): Node[] {
    let nL = this.numLayers;
    return _.filter(this.nodes,function(n:Node){return n.layer > 0 && n.layer < (nL - 1)});
  }
}